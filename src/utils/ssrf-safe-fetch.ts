import { getConfig } from '../config/index.js';
import { getLogger } from './logger.js';
import crypto from 'crypto';

/**
 * SSRF-Safe Web Fetch Utility
 * Validates URLs, blocks private IPs, enforces allowlists
 */

const logger = getLogger();

// Private IP ranges and special addresses to block
const BLOCKED_PATTERNS = [
  /^127\./, // 127.0.0.0/8 - Loopback
  /^10\./, // 10.0.0.0/8 - Private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 - Private
  /^192\.168\./, // 192.168.0.0/16 - Private
  /^169\.254\./, // 169.254.0.0/16 - Link-local
  /^0\./, // 0.0.0.0/8
  /^224\./, // 224.0.0.0/4 - Multicast
  /^240\./, // 240.0.0.0/4 - Reserved
  /^255\.255\.255\.255/, // Broadcast
  /^::1$/, // IPv6 loopback
  /^fe80:/, // IPv6 link-local
  /^fc00:/, // IPv6 unique local
  /^fd00:/, // IPv6 unique local
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  '169.254.169.254', // AWS/GCP metadata
  '100.100.100.200', // Alibaba metadata
];

export interface FetchResult {
  url: string;
  title: string;
  content: string;
  contentHash: string;
  fetchedAt: string;
  statusCode: number;
}

export interface FetchError {
  url: string;
  reason: string;
  details?: string;
}

/**
 * Validate URL for SSRF safety
 */
function validateUrl(url: string): { valid: boolean; reason?: string } {
  try {
    const urlObj = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Check for blocked hostnames
    const hostname = urlObj.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { valid: false, reason: `Hostname "${hostname}" is blocked` };
    }

    // Check if hostname is an IP address
    const ipMatch =
      hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/) || hostname.match(/^\[?([a-f0-9:]+)\]?$/i);
    if (ipMatch) {
      // Check against blocked IP patterns
      for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(hostname)) {
          return { valid: false, reason: `IP address "${hostname}" is in a blocked range` };
        }
      }
    }

    // Check against allowed domains
    const config = getConfig();
    const allowedDomains = config.ALLOWED_DOMAINS;

    const isAllowed = allowedDomains.some((domain) => {
      if (domain.startsWith('.')) {
        // Domain suffix match (e.g., .edu matches any .edu domain)
        return hostname.endsWith(domain);
      }
      // Exact or subdomain match
      return hostname === domain || hostname.endsWith('.' + domain);
    });

    if (!isAllowed) {
      return {
        valid: false,
        reason: `Domain "${hostname}" is not in the allowed list. Allowed: ${allowedDomains.join(', ')}`,
      };
    }

    return { valid: true };
  } catch (_error) {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * Perform SSRF-safe fetch with timeout and size limits
 */
export async function safeFetch(url: string): Promise<FetchResult | FetchError> {
  const config = getConfig();
  const validation = validateUrl(url);

  if (!validation.valid) {
    logger.warn({ url, reason: validation.reason }, 'Fetch blocked by SSRF check');
    return {
      url,
      reason: 'SSRF Check Failed',
      details: validation.reason,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.FETCH_TIMEOUT_MS);

    logger.info({ url }, 'Fetching URL');

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BoDiGi-MCP-Server/1.0',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn({ url, status: response.status }, 'Fetch failed with non-OK status');
      return {
        url,
        reason: 'HTTP Error',
        details: `Status: ${response.status} ${response.statusText}`,
      };
    }

    // Read response with size limit
    const reader = response.body?.getReader();
    if (!reader) {
      return {
        url,
        reason: 'No response body',
      };
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalSize += value.length;
      if (totalSize > config.MAX_FETCH_BYTES) {
        reader.cancel();
        return {
          url,
          reason: 'Content too large',
          details: `Exceeded ${config.MAX_FETCH_BYTES} bytes`,
        };
      }

      chunks.push(value);
    }

    // Combine chunks
    const buffer = new Uint8Array(totalSize);
    let position = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, position);
      position += chunk.length;
    }

    // Decode as text
    const content = new TextDecoder().decode(buffer);

    // Extract title from HTML if present
    let title = '';
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      // Use hostname as fallback
      const urlObj = new URL(url);
      title = urlObj.hostname;
    }

    // Clean content (remove HTML tags for basic text extraction)
    const cleanContent = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Calculate content hash
    const contentHash = crypto.createHash('sha256').update(cleanContent).digest('hex');

    logger.info({ url, size: totalSize, hash: contentHash }, 'Fetch successful');

    return {
      url,
      title,
      content: cleanContent,
      contentHash,
      fetchedAt: new Date().toISOString(),
      statusCode: response.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ url, error: errorMessage }, 'Fetch failed');

    if (errorMessage.includes('aborted')) {
      return {
        url,
        reason: 'Timeout',
        details: `Request exceeded ${config.FETCH_TIMEOUT_MS}ms`,
      };
    }

    return {
      url,
      reason: 'Fetch Error',
      details: errorMessage,
    };
  }
}

/**
 * Check if a fetch result is an error
 */
export function isFetchError(result: FetchResult | FetchError): result is FetchError {
  return 'reason' in result;
}

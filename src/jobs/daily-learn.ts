import { knowledgeSourcesDb, knowledgeDb, botStateDb } from '../db/index.js';
import { safeFetch, isFetchError } from '../utils/ssrf-safe-fetch.js';
import { getLogger } from '../utils/logger.js';

/**
 * Daily Learning Job
 * Fetches from enabled knowledge sources, checks for changes, and ingests new content
 */

const logger = getLogger();

export interface DailyLearnResult {
  success: boolean;
  sourcesProcessed: number;
  newKnowledge: number;
  unchanged: number;
  errors: string[];
  timestamp: string;
}

/**
 * Execute daily learning job
 */
export async function executeDailyLearn(): Promise<DailyLearnResult> {
  logger.info('Starting daily learning job');
  
  const result: DailyLearnResult = {
    success: false,
    sourcesProcessed: 0,
    newKnowledge: 0,
    unchanged: 0,
    errors: [],
    timestamp: new Date().toISOString()
  };
  
  try {
    // Get enabled knowledge sources
    const sources = knowledgeSourcesDb.getEnabled();
    
    if (sources.length === 0) {
      logger.warn('No enabled knowledge sources found');
      result.errors.push('No enabled knowledge sources configured');
      return result;
    }
    
    logger.info({ count: sources.length }, 'Processing knowledge sources');
    
    // Process each source
    for (const source of sources) {
      try {
        logger.info({ source: source.name, url: source.url }, 'Fetching source');
        
        // Fetch content
        const fetchResult = await safeFetch(source.url);
        
        if (isFetchError(fetchResult)) {
          logger.warn({ source: source.name, reason: fetchResult.reason }, 'Source fetch failed');
          result.errors.push(`${source.name}: ${fetchResult.reason}`);
          continue;
        }
        
        // Check if content already exists (by hash)
        const existing = knowledgeDb.findByHash(fetchResult.contentHash);
        
        if (existing) {
          logger.info({ source: source.name, hash: fetchResult.contentHash }, 'Content unchanged');
          result.unchanged++;
        } else {
          // New content - ingest it
          logger.info({ source: source.name, hash: fetchResult.contentHash }, 'New content detected');
          
          knowledgeDb.insert({
            source_url: source.url,
            title: fetchResult.title,
            content: fetchResult.content,
            content_hash: fetchResult.contentHash,
            category: source.name,
            priority: 'medium'
          });
          
          result.newKnowledge++;
        }
        
        // Update last fetched timestamp
        knowledgeSourcesDb.updateLastFetched(source.id!, fetchResult.fetchedAt);
        result.sourcesProcessed++;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error({ source: source.name, error: errorMsg }, 'Error processing source');
        result.errors.push(`${source.name}: ${errorMsg}`);
      }
    }
    
    // Update bot state
    botStateDb.upsert({
      bot_name: 'daily-learn-job',
      last_learned_at: result.timestamp,
      notes_json: JSON.stringify({
        sourcesProcessed: result.sourcesProcessed,
        newKnowledge: result.newKnowledge,
        unchanged: result.unchanged,
        errors: result.errors.length
      })
    });
    
    result.success = result.errors.length === 0;
    
    logger.info({ 
      sourcesProcessed: result.sourcesProcessed,
      newKnowledge: result.newKnowledge,
      unchanged: result.unchanged,
      errors: result.errors.length
    }, 'Daily learning job completed');
    
    return result;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMsg }, 'Daily learning job failed');
    result.errors.push(`Fatal error: ${errorMsg}`);
    return result;
  }
}

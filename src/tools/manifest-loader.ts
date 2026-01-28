import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ToolManifest } from '../types/tool-manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load a tool manifest from JSON file
 */
export function loadToolManifest(toolName: string): ToolManifest | null {
  try {
    const manifestPath = join(__dirname, 'manifests', `${toolName}.json`);
    const manifestData = readFileSync(manifestPath, 'utf-8');
    return JSON.parse(manifestData) as ToolManifest;
  } catch (error) {
    console.error(`Failed to load manifest for ${toolName}:`, error);
    return null;
  }
}

/**
 * Load all tool manifests
 */
export function loadAllManifests(): Map<string, ToolManifest> {
  const manifests = new Map<string, ToolManifest>();
  
  const toolNames = [
    'ai-teaching',
    'tool-discovery',
    'web-fetch',
    'knowledge-ingest',
    'lesson-quiz-gen',
    'bot-knowledge-update',
    'needs-analyzer',
    'enable-tool'
  ];
  
  for (const toolName of toolNames) {
    const manifest = loadToolManifest(toolName);
    if (manifest) {
      manifests.set(manifest.name, manifest);
    }
  }
  
  return manifests;
}

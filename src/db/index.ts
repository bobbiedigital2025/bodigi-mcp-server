import Database from 'better-sqlite3';
import { getConfig } from '../config/index.js';
import fs from 'fs';
import path from 'path';

/**
 * Database layer using SQLite (better-sqlite3)
 * Handles persistent storage for knowledge, audit logs, and bot state
 */

export interface KnowledgeItem {
  id?: number;
  source_url: string;
  title: string;
  content: string;
  content_hash: string;
  category: string;
  priority: string;
  created_at?: string;
}

export interface ToolAudit {
  id?: number;
  api_key_hint: string;
  tool_name: string;
  params_json: string;
  created_at?: string;
  status: string;
  error?: string;
}

export interface BotState {
  id?: number;
  bot_name: string;
  last_learned_at: string;
  notes_json: string;
}

export interface KnowledgeSource {
  id?: number;
  name: string;
  url: string;
  enabled: boolean;
  last_fetched_at?: string;
  fetch_interval_hours: number;
}

let db: Database.Database | null = null;

/**
 * Initialize the database and create tables if they don't exist
 */
export function initDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const config = getConfig();
  const dbPath = config.SQLITE_PATH;
  
  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  
  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');
  
  // Create tables
  createTables(db);
  
  return db;
}

/**
 * Create all required tables
 */
function createTables(database: Database.Database): void {
  // Knowledge items table
  database.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_url TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tool audit log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS tool_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key_hint TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      params_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,
      error TEXT
    )
  `);

  // Bot state table
  database.exec(`
    CREATE TABLE IF NOT EXISTS bot_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_name TEXT NOT NULL UNIQUE,
      last_learned_at TEXT NOT NULL,
      notes_json TEXT DEFAULT '{}'
    )
  `);

  // Knowledge sources table
  database.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      last_fetched_at TEXT,
      fetch_interval_hours INTEGER DEFAULT 24
    )
  `);

  // Create indexes for better query performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_items(category);
    CREATE INDEX IF NOT EXISTS idx_knowledge_priority ON knowledge_items(priority);
    CREATE INDEX IF NOT EXISTS idx_tool_audit_tool_name ON tool_audit(tool_name);
    CREATE INDEX IF NOT EXISTS idx_tool_audit_created_at ON tool_audit(created_at);
  `);
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Knowledge Items - CRUD operations
 */
export const knowledgeDb = {
  insert(item: KnowledgeItem): number {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO knowledge_items (source_url, title, content, content_hash, category, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      item.source_url,
      item.title,
      item.content,
      item.content_hash,
      item.category,
      item.priority
    );
    return result.lastInsertRowid as number;
  },

  findByHash(hash: string): KnowledgeItem | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM knowledge_items WHERE content_hash = ?');
    return stmt.get(hash) as KnowledgeItem | undefined;
  },

  search(params: { category?: string; priority?: string; keyword?: string; limit?: number }): KnowledgeItem[] {
    const db = getDatabase();
    const { category, priority, keyword, limit = 50 } = params;
    
    let query = 'SELECT * FROM knowledge_items WHERE 1=1';
    const queryParams: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      queryParams.push(category);
    }
    
    if (priority) {
      query += ' AND priority = ?';
      queryParams.push(priority);
    }
    
    if (keyword) {
      query += ' AND (title LIKE ? OR content LIKE ?)';
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    queryParams.push(limit);
    
    const stmt = db.prepare(query);
    return stmt.all(...queryParams) as KnowledgeItem[];
  },

  getAll(limit: number = 100): KnowledgeItem[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM knowledge_items ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit) as KnowledgeItem[];
  }
};

/**
 * Tool Audit - CRUD operations
 */
export const auditDb = {
  insert(audit: ToolAudit): number {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO tool_audit (api_key_hint, tool_name, params_json, status, error)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      audit.api_key_hint,
      audit.tool_name,
      audit.params_json,
      audit.status,
      audit.error || null
    );
    return result.lastInsertRowid as number;
  },

  getRecent(limit: number = 100): ToolAudit[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tool_audit ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit) as ToolAudit[];
  },

  getByToolName(toolName: string, limit: number = 50): ToolAudit[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tool_audit WHERE tool_name = ? ORDER BY created_at DESC LIMIT ?');
    return stmt.all(toolName, limit) as ToolAudit[];
  }
};

/**
 * Bot State - CRUD operations
 */
export const botStateDb = {
  upsert(state: BotState): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO bot_state (bot_name, last_learned_at, notes_json)
      VALUES (?, ?, ?)
      ON CONFLICT(bot_name) DO UPDATE SET
        last_learned_at = excluded.last_learned_at,
        notes_json = excluded.notes_json
    `);
    stmt.run(state.bot_name, state.last_learned_at, state.notes_json);
  },

  get(botName: string): BotState | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM bot_state WHERE bot_name = ?');
    return stmt.get(botName) as BotState | undefined;
  },

  getAll(): BotState[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM bot_state');
    return stmt.all() as BotState[];
  }
};

/**
 * Knowledge Sources - CRUD operations
 */
export const knowledgeSourcesDb = {
  insert(source: KnowledgeSource): number {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO knowledge_sources (name, url, enabled, fetch_interval_hours)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      source.name,
      source.url,
      source.enabled ? 1 : 0,
      source.fetch_interval_hours
    );
    return result.lastInsertRowid as number;
  },

  getEnabled(): KnowledgeSource[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM knowledge_sources WHERE enabled = 1');
    return stmt.all() as KnowledgeSource[];
  },

  updateLastFetched(id: number, timestamp: string): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE knowledge_sources SET last_fetched_at = ? WHERE id = ?');
    stmt.run(timestamp, id);
  },

  getAll(): KnowledgeSource[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM knowledge_sources');
    return stmt.all() as KnowledgeSource[];
  }
};

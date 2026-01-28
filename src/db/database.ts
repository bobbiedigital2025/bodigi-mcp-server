import Database from 'better-sqlite3';
import { resolve } from 'path';

export interface OAuthClient {
  id: number;
  client_id: string;
  client_secret_hash: string;
  scopes: string;
  created_at: string;
}

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string = './data/bodigi.db') {
    const fullPath = resolve(dbPath);
    this.db = new Database(fullPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Create oauth_clients table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS oauth_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL UNIQUE,
        client_secret_hash TEXT NOT NULL,
        scopes TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on client_id for faster lookups
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id 
      ON oauth_clients(client_id)
    `);
  }

  public getClientByClientId(clientId: string): OAuthClient | undefined {
    const stmt = this.db.prepare('SELECT * FROM oauth_clients WHERE client_id = ?');
    return stmt.get(clientId) as OAuthClient | undefined;
  }

  public createClient(clientId: string, clientSecretHash: string, scopes: string[]): OAuthClient {
    const scopesStr = scopes.join(',');
    const stmt = this.db.prepare(
      'INSERT INTO oauth_clients (client_id, client_secret_hash, scopes) VALUES (?, ?, ?)'
    );
    const result = stmt.run(clientId, clientSecretHash, scopesStr);
    
    return {
      id: result.lastInsertRowid as number,
      client_id: clientId,
      client_secret_hash: clientSecretHash,
      scopes: scopesStr,
      created_at: new Date().toISOString()
    };
  }

  public listClients(): OAuthClient[] {
    const stmt = this.db.prepare('SELECT * FROM oauth_clients ORDER BY created_at DESC');
    return stmt.all() as OAuthClient[];
  }

  public deleteClient(clientId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM oauth_clients WHERE client_id = ?');
    const result = stmt.run(clientId);
    return result.changes > 0;
  }

  public close(): void {
    this.db.close();
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null;

export function getDatabase(dbPath?: string): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService(dbPath);
  }
  return dbInstance;
}

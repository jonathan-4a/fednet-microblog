// src/connection.ts
import { Kysely } from "kysely";
import { BunSqliteDialect } from "@meck93/kysely-bun-sqlite";
import { Database } from "bun:sqlite";
import path from "path";
import type { DbTables } from "./schema";

let dbInstance: Kysely<DbTables> | null = null;

function createDatabase(dbPath?: string): Kysely<DbTables> {
  if (dbInstance) return dbInstance;

  const databasePath = dbPath || process.env.DB_PATH;
  if (!databasePath) {
    const err = new Error("DB_PATH environment variable is not set");
    err.name = "DatabaseConfigError";
    throw err;
  }

  try {
    const fullDbPath = path.resolve(process.cwd(), databasePath);
    console.log(`[DB] Connecting to SQLite at: ${fullDbPath}`);

    const nativeDb = new Database(fullDbPath);

    dbInstance = new Kysely<DbTables>({
      dialect: new BunSqliteDialect({ database: nativeDb }),
    });

    return dbInstance;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const err = new Error(`Database connection failed: ${msg}`);
    err.name = "DatabaseConnectionError";
    err.cause = error instanceof Error ? error : undefined;
    throw err;
  }
}

// Export singleton db instance
export const db = createDatabase(process.env.DB_PATH);


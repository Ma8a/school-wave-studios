import "server-only";

import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/**
 * Path to the SQLite file. In dev = ./data/sws.db at the project root.
 * In Docker we'll override via DB_PATH=/data/sws.db with a mounted volume.
 */
const DB_PATH = process.env.DB_PATH ?? resolve(process.cwd(), "data", "sws.db");

function createDb() {
  // Make sure the directory exists so first run doesn't crash.
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const sqlite = new Database(DB_PATH);
  // WAL = better concurrency on read while a write is in progress.
  sqlite.pragma("journal_mode = WAL");
  // Required for `references({ onDelete: "cascade" })` to actually cascade.
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

/**
 * Hot-reload-safe singleton. Without this, every `next dev` recompile would
 * leak a new sqlite handle until we ran out of file descriptors.
 */
const globalForDb = globalThis as unknown as {
  __sws_db?: ReturnType<typeof createDb>;
};

export const db: ReturnType<typeof createDb> =
  globalForDb.__sws_db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__sws_db = db;
}

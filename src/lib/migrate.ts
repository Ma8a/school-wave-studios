import "server-only";

import { resolve } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./db";

/**
 * Applies any pending Drizzle migrations to the live SQLite file.
 *
 * Called once at server startup from `src/instrumentation.ts` (production
 * only — dev keeps using `pnpm db:push` against the local DB).
 *
 * The migrator is idempotent: it creates a `__drizzle_migrations` table
 * on first run, records which files have been applied, and skips the ones
 * that have. Safe to call on every container boot.
 */
export function runMigrations(): void {
  const migrationsFolder = resolve(process.cwd(), "drizzle");
  migrate(db, { migrationsFolder });
}

/**
 * Next.js instrumentation — runs once when the server boots.
 *
 * We use it to apply any pending database migrations before the app starts
 * taking requests, so a fresh container can `docker compose up -d` and
 * immediately be ready to serve, even with an empty SQLite volume.
 *
 * Guarded so it only fires in the Node.js runtime (not Edge) and only in
 * production (dev keeps using `pnpm db:push`).
 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production"
  ) {
    const { runMigrations } = await import("./lib/migrate");
    runMigrations();
  }
}

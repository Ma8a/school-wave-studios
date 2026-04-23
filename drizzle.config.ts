import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit reads this when generating migrations and pushing schema
 * changes to the SQLite file.
 *
 * The DB file lives in ./data/sws.db so it's easy to mount as a Docker
 * volume in production. In dev, the file is created on first run.
 */
export default {
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_PATH ?? "./data/sws.db",
  },
} satisfies Config;

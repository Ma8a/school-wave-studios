import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * The full server-side schema for School Wave Studios.
 *
 * Conventions:
 *  - All IDs are text (UUIDs) so we can generate them client-side or server-side
 *    without sequence coordination.
 *  - All timestamps are ISO 8601 strings stored as text — sortable lexically.
 *  - All per-user tables have `userId` with `onDelete: "cascade"` so deleting
 *    a user wipes everything that belongs to them.
 *
 * Phase 1 only USES users / sessions / lessons. The other tables are defined
 * here so we don't need a second migration when later phases wire them up.
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  /** Display name shown in greetings — separate from username. */
  name: text("name").notNull(),
  pinHash: text("pin_hash").notNull(),
  salt: text("salt").notNull(),
  createdAt: text("created_at").notNull(),
  /**
   * Which fortnightly week the user is currently on — 1 = Week 1, 2 = Week 2.
   * User flips this manually in Settings at the start of each new fortnight.
   * Schools with only one week ignore this entirely (everything stays in Week 1).
   */
  currentWeek: integer("current_week").notNull().default(1),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (t) => [index("idx_sessions_user").on(t.userId)],
);

export const lessons = sqliteTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** ISO weekday: 1 = Mon … 7 = Sun. */
    day: integer("day").notNull(),
    /** Fortnight half: 1 = Week 1, 2 = Week 2. Default 1 for weekly timetables. */
    week: integer("week").notNull().default(1),
    /** "HH:mm" in the user's local time. */
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    subject: text("subject").notNull(),
    teacher: text("teacher"),
    room: text("room"),
    color: text("color"),
    notes: text("notes"),
  },
  (t) => [index("idx_lessons_user").on(t.userId)],
);

export const homework = sqliteTable(
  "homework",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subject: text("subject"),
    /** YYYY-MM-DD. */
    dueDate: text("due_date").notNull(),
    description: text("description"),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    doneAt: text("done_at"),
    createdAt: text("created_at").notNull(),
    color: text("color"),
  },
  (t) => [index("idx_homework_user").on(t.userId)],
);

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subject: text("subject"),
    content: text("content").notNull().default(""),
    color: text("color"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("idx_notes_user").on(t.userId)],
);

export const scoreEntries = sqliteTable(
  "score_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** "plus" | "minus" | "remark" — checked in API layer. */
    type: text("type").notNull(),
    /** YYYY-MM-DD. */
    date: text("date").notNull(),
    reason: text("reason"),
    subject: text("subject"),
    teacher: text("teacher"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("idx_score_user").on(t.userId)],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** "test" | "holiday" | "trip" | "event". */
    type: text("type").notNull(),
    title: text("title").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    subject: text("subject"),
    description: text("description"),
    color: text("color"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("idx_events_user").on(t.userId)],
);

export const flashcardDecks = sqliteTable(
  "flashcard_decks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subject: text("subject"),
    description: text("description"),
    color: text("color"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("idx_decks_user").on(t.userId)],
);

export const flashcards = sqliteTable(
  "flashcards",
  {
    id: text("id").primaryKey(),
    deckId: text("deck_id")
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: "cascade" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    /** Sort order within the deck. Server-assigned. */
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("idx_cards_deck").on(t.deckId)],
);

// Suppress "sql is unused" if no defaults reference it yet — keep the import
// available so adding `default(sql\`...\`)` later is friction-free.
void sql;

export type ScoreEntryType = "plus" | "minus" | "remark";

export interface ScoreEntry {
  id: string;
  type: ScoreEntryType;
  /** ISO date YYYY-MM-DD (no time component). */
  date: string;
  /** Optional teacher remark / reason text. Required for `remark`. */
  reason?: string;
  /** Optional subject (links to a lesson subject). */
  subject?: string;
  /** Optional teacher name. */
  teacher?: string;
  createdAt: string; // ISO datetime
}

export const ENTRY_TYPES: ScoreEntryType[] = ["plus", "minus", "remark"];

export const ENTRY_LABELS: Record<ScoreEntryType, string> = {
  plus: "Positives",
  minus: "Negatives",
  remark: "Detentions",
};

/**
 * Singular labels — used in confirmation messages and add buttons.
 *
 * Note: the underlying database type values stay as `plus | minus | remark`
 * (internal identifiers, never shown to the user). Only the labels above
 * change. So renaming the user-facing copy doesn't require a data migration.
 */
export const ENTRY_LABEL_SINGULAR: Record<ScoreEntryType, string> = {
  plus: "positive",
  minus: "negative",
  remark: "detention",
};

/**
 * Reuses the warm-dark palette: moss for positive, rust for negative, mustard
 * for attention-grabbing remarks.
 */
export const ENTRY_HEX: Record<ScoreEntryType, string> = {
  plus: "#7d9966",
  minus: "#b25c4a",
  remark: "#c79a3a",
};

export type Period = "week" | "month" | "all";

export const PERIOD_LABELS: Record<Period, string> = {
  week: "This week",
  month: "This month",
  all: "All time",
};

export const PERIODS: Period[] = ["week", "month", "all"];

/** True if `entry.date` falls within the rolling N-day window from `now`. */
export function isInPeriod(
  entry: ScoreEntry,
  period: Period,
  now: Date = new Date(),
): boolean {
  if (period === "all") return true;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDate = new Date(`${entry.date}T00:00:00`);
  const days = period === "week" ? 7 : 30;
  const diff = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff < days;
}

export function filterByPeriod(
  entries: ScoreEntry[],
  period: Period,
  now: Date = new Date(),
): ScoreEntry[] {
  return entries.filter((e) => isInPeriod(e, period, now));
}

export function countByType(entries: ScoreEntry[]): Record<ScoreEntryType, number> {
  const out: Record<ScoreEntryType, number> = { plus: 0, minus: 0, remark: 0 };
  for (const e of entries) out[e.type]++;
  return out;
}

export function newScoreEntryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `score-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidScoreEntry(s: unknown): s is ScoreEntry {
  if (!s || typeof s !== "object") return false;
  const x = s as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    (x.type === "plus" || x.type === "minus" || x.type === "remark") &&
    typeof x.date === "string" &&
    typeof x.createdAt === "string"
  );
}

/** Newest first by date, then by createdAt to break date ties. */
export function compareEntriesByDateDesc(a: ScoreEntry, b: ScoreEntry): number {
  const cmp = b.date.localeCompare(a.date);
  if (cmp !== 0) return cmp;
  return b.createdAt.localeCompare(a.createdAt);
}

/** YYYY-MM-DD in local time. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Friendly date label: "Today", "Yesterday", "12 Apr". */
export function entryDateLabel(date: string, today: string = todayISO()): string {
  if (date === today) return "Today";
  const todayMs = new Date(`${today}T00:00:00`).getTime();
  const dateMs = new Date(`${date}T00:00:00`).getTime();
  const diffDays = Math.round((todayMs - dateMs) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 6) return `${diffDays} days ago`;
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

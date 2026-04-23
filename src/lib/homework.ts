import type { LessonColor } from "./timetable";

export interface Homework {
  id: string;
  title: string;
  subject?: string;
  /** ISO date in YYYY-MM-DD form (no time component). */
  dueDate: string;
  description?: string;
  done: boolean;
  doneAt?: string; // ISO datetime
  createdAt: string; // ISO datetime
  color?: LessonColor;
}

export type HomeworkBucket = "overdue" | "today" | "thisWeek" | "later" | "done";

export const BUCKET_LABELS: Record<HomeworkBucket, string> = {
  overdue: "Overdue",
  today: "Due today",
  thisWeek: "This week",
  later: "Later",
  done: "Done",
};

export const BUCKET_ORDER: HomeworkBucket[] = [
  "overdue",
  "today",
  "thisWeek",
  "later",
  "done",
];

export function newHomeworkId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `hw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** YYYY-MM-DD in local time — matches `<input type="date">`. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole calendar days from `from` to `to` (positive if `to` is later). */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function classifyHomework(
  hw: Homework,
  today: string = todayISO(),
): HomeworkBucket {
  if (hw.done) return "done";
  const delta = daysBetween(today, hw.dueDate);
  if (delta < 0) return "overdue";
  if (delta === 0) return "today";
  if (delta <= 7) return "thisWeek";
  return "later";
}

export function groupHomeworkByBucket(
  homework: Homework[],
  today: string = todayISO(),
): Record<HomeworkBucket, Homework[]> {
  const groups: Record<HomeworkBucket, Homework[]> = {
    overdue: [],
    today: [],
    thisWeek: [],
    later: [],
    done: [],
  };
  for (const hw of homework) {
    groups[classifyHomework(hw, today)].push(hw);
  }
  // Active buckets: soonest first; done bucket: most recently completed first
  for (const k of BUCKET_ORDER) {
    if (k === "done") {
      groups[k].sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));
    } else {
      groups[k].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }
  }
  return groups;
}

export function isValidHomework(h: unknown): h is Homework {
  if (!h || typeof h !== "object") return false;
  const x = h as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.title === "string" &&
    typeof x.dueDate === "string" &&
    typeof x.done === "boolean" &&
    typeof x.createdAt === "string"
  );
}

/** Friendly relative label like "in 3 days" / "yesterday" / "today". */
export function relativeDueLabel(dueDate: string, today: string = todayISO()): string {
  const d = daysBetween(today, dueDate);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  if (d > 1 && d <= 14) return `in ${d} days`;
  if (d < -1 && d >= -14) return `${Math.abs(d)} days ago`;
  // Fall back to a short date for far-out items
  const date = new Date(`${dueDate}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

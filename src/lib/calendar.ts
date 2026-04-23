import type { LessonColor } from "./timetable";

export type EventType = "test" | "holiday" | "trip" | "event";

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  /** ISO date YYYY-MM-DD (no time component). */
  startDate: string;
  /** ISO date YYYY-MM-DD. Same as start for single-day events. */
  endDate: string;
  subject?: string;
  description?: string;
  color?: LessonColor;
  createdAt: string;
}

export const EVENT_TYPES: EventType[] = ["test", "holiday", "trip", "event"];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  test: "Test",
  holiday: "Holiday",
  trip: "Trip",
  event: "Event",
};

/**
 * Default colors per event type — drawn from the warm-dark palette.
 * Tests = rust (attention), holidays = moss (positive break),
 * trips = dusty-blue (movement/travel), events = mustard (general).
 */
export const EVENT_DEFAULT_COLOR: Record<EventType, LessonColor> = {
  test: "rust",
  holiday: "moss",
  trip: "dusty-blue",
  event: "amber",
};

export type EventBucket = "thisWeek" | "comingUp" | "later" | "past";

export const BUCKET_LABELS: Record<EventBucket, string> = {
  thisWeek: "This week",
  comingUp: "Coming up",
  later: "Later",
  past: "Past",
};

export const BUCKET_ORDER: EventBucket[] = [
  "thisWeek",
  "comingUp",
  "later",
  "past",
];

export function newCalendarEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidCalendarEvent(e: unknown): e is CalendarEvent {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    (x.type === "test" || x.type === "holiday" || x.type === "trip" || x.type === "event") &&
    typeof x.title === "string" &&
    typeof x.startDate === "string" &&
    typeof x.endDate === "string" &&
    typeof x.createdAt === "string"
  );
}

/** YYYY-MM-DD in local time (matches `<input type="date">`). */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Buckets events by their *end* date so a multi-day holiday that's still
 * ongoing today is treated as upcoming, not past.
 */
export function classifyEvent(
  ev: CalendarEvent,
  today: string = todayISO(),
): EventBucket {
  const endDelta = daysBetween(today, ev.endDate);
  const startDelta = daysBetween(today, ev.startDate);
  if (endDelta < 0) return "past";
  // If it has already started OR starts within 7 days, it's "this week".
  if (startDelta <= 7) return "thisWeek";
  if (startDelta <= 30) return "comingUp";
  return "later";
}

export function groupEventsByBucket(
  events: CalendarEvent[],
  today: string = todayISO(),
): Record<EventBucket, CalendarEvent[]> {
  const groups: Record<EventBucket, CalendarEvent[]> = {
    thisWeek: [],
    comingUp: [],
    later: [],
    past: [],
  };
  for (const ev of events) {
    groups[classifyEvent(ev, today)].push(ev);
  }
  for (const k of BUCKET_ORDER) {
    if (k === "past") {
      // Past: most recent first
      groups[k].sort((a, b) => b.startDate.localeCompare(a.startDate));
    } else {
      // Upcoming: soonest first
      groups[k].sort((a, b) => a.startDate.localeCompare(b.startDate));
    }
  }
  return groups;
}

/** "22 Apr" or "22-26 Apr" or "29 Apr – 3 May" for ranges that cross months. */
export function formatEventDateRange(start: string, end: string): string {
  const sd = new Date(`${start}T00:00:00`);
  const ed = new Date(`${end}T00:00:00`);
  const sameDay = start === end;
  const sameMonth = sd.getMonth() === ed.getMonth() && sd.getFullYear() === ed.getFullYear();
  const monthShort = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });

  if (sameDay) {
    return `${sd.getDate()} ${monthShort(sd)}`;
  }
  if (sameMonth) {
    return `${sd.getDate()}–${ed.getDate()} ${monthShort(sd)}`;
  }
  return `${sd.getDate()} ${monthShort(sd)} – ${ed.getDate()} ${monthShort(ed)}`;
}

/** Friendly relative label: "today", "tomorrow", "in 3 days", "ended yesterday". */
export function relativeEventLabel(
  ev: CalendarEvent,
  today: string = todayISO(),
): string {
  const startDelta = daysBetween(today, ev.startDate);
  const endDelta = daysBetween(today, ev.endDate);
  if (endDelta < 0) {
    if (endDelta === -1) return "ended yesterday";
    if (endDelta >= -7) return `ended ${Math.abs(endDelta)} days ago`;
    return formatEventDateRange(ev.startDate, ev.endDate);
  }
  if (startDelta <= 0 && endDelta >= 0) {
    return endDelta === 0 ? "today" : "happening now";
  }
  if (startDelta === 1) return "tomorrow";
  if (startDelta <= 14) return `in ${startDelta} days`;
  return formatEventDateRange(ev.startDate, ev.endDate);
}

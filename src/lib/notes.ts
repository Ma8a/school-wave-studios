import type { LessonColor } from "./timetable";

export interface Note {
  id: string;
  title: string;
  subject?: string;
  /** Markdown source. */
  content: string;
  color?: LessonColor;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export function newNoteId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidNote(n: unknown): n is Note {
  if (!n || typeof n !== "object") return false;
  const x = n as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.title === "string" &&
    typeof x.content === "string" &&
    typeof x.createdAt === "string" &&
    typeof x.updatedAt === "string"
  );
}

/** Strip light markdown for a plain-text preview snippet on cards. */
export function previewText(content: string, maxChars = 140): string {
  const stripped = content
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/^#+\s+/gm, "") // heading hashes
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .replace(/^[-*+]\s+/gm, "") // bullet markers
    .replace(/^\d+\.\s+/gm, "") // ordered list markers
    .replace(/^>\s?/gm, "") // blockquote markers
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= maxChars) return stripped;
  return stripped.slice(0, maxChars - 1) + "…";
}

export function compareNotesByUpdated(a: Note, b: Note): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

/** Friendly relative time: "just now", "5 min ago", "2 days ago", or a short date. */
export function relativeTimeLabel(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

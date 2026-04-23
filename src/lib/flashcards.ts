import type { LessonColor } from "./timetable";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject?: string;
  description?: string;
  color?: LessonColor;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}

export function newDeckId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newCardId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidCard(c: unknown): c is Flashcard {
  if (!c || typeof c !== "object") return false;
  const x = c as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.front === "string" &&
    typeof x.back === "string"
  );
}

export function isValidDeck(d: unknown): d is FlashcardDeck {
  if (!d || typeof d !== "object") return false;
  const x = d as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.title === "string" &&
    Array.isArray(x.cards) &&
    x.cards.every(isValidCard) &&
    typeof x.createdAt === "string" &&
    typeof x.updatedAt === "string"
  );
}

export function compareDecksByUpdated(a: FlashcardDeck, b: FlashcardDeck): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

/** Fisher–Yates shuffle, returning a new array — does not mutate input. */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

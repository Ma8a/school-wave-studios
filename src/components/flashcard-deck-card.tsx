"use client";

import Link from "next/link";
import { BookOpen, Layers } from "lucide-react";
import { LESSON_COLORS } from "@/lib/timetable";
import { type FlashcardDeck } from "@/lib/flashcards";
import { relativeTimeLabel } from "@/lib/notes";

export function FlashcardDeckCard({ deck }: { deck: FlashcardDeck }) {
  const color = LESSON_COLORS[deck.color ?? "neutral"];
  const cardCount = deck.cards.length;

  return (
    <Link
      href={`/flashcards/${deck.id}`}
      className="group flex items-stretch overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className="w-1.5 shrink-0"
        style={{ backgroundColor: color.hex }}
      />
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full ml-3"
        style={{ backgroundColor: `${color.hex}26`, color: color.hex }}
      >
        <Layers className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <div className="flex flex-1 flex-col gap-1 p-3 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="line-clamp-1 text-sm font-semibold leading-tight">
            {deck.title || "Untitled deck"}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {relativeTimeLabel(deck.updatedAt)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>
            {cardCount} {cardCount === 1 ? "card" : "cards"}
          </span>
          {deck.subject && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {deck.subject}
              </span>
            </>
          )}
        </div>
        {deck.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {deck.description}
          </p>
        )}
      </div>
    </Link>
  );
}

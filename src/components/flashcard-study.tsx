"use client";

import { useMemo, useState } from "react";
import { Check, RotateCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shuffle, type Flashcard } from "@/lib/flashcards";
import { LESSON_COLORS, type LessonColor } from "@/lib/timetable";
import { cn } from "@/lib/utils";

interface FlashcardStudyProps {
  cards: Flashcard[];
  color: LessonColor;
  onExit: () => void;
}

interface SessionState {
  order: Flashcard[];
  index: number;
  flipped: boolean;
  /** Card ids the user said they knew. */
  known: Set<string>;
  /** Card ids the user said they didn't know. */
  unknown: Set<string>;
}

function createSession(cards: Flashcard[]): SessionState {
  return {
    order: shuffle(cards),
    index: 0,
    flipped: false,
    known: new Set(),
    unknown: new Set(),
  };
}

export function FlashcardStudy({ cards, color, onExit }: FlashcardStudyProps) {
  const initial = useMemo(() => createSession(cards), [cards]);
  const [session, setSession] = useState<SessionState>(initial);

  const total = session.order.length;
  const done = session.index >= total;
  const current = done ? null : session.order[session.index];
  const hex = LESSON_COLORS[color].hex;

  function flip() {
    setSession((s) => ({ ...s, flipped: !s.flipped }));
  }

  function answer(known: boolean) {
    setSession((s) => {
      if (s.index >= s.order.length) return s;
      const card = s.order[s.index];
      const nextKnown = new Set(s.known);
      const nextUnknown = new Set(s.unknown);
      if (known) nextKnown.add(card.id);
      else nextUnknown.add(card.id);
      return {
        ...s,
        index: s.index + 1,
        flipped: false,
        known: nextKnown,
        unknown: nextUnknown,
      };
    });
  }

  function restart() {
    setSession(createSession(cards));
  }

  function studyMissed() {
    const missed = cards.filter((c) => session.unknown.has(c.id));
    if (missed.length === 0) {
      restart();
      return;
    }
    setSession(createSession(missed));
  }

  if (done) {
    const correctCount = session.known.size;
    const missedCount = session.unknown.size;
    const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <span
          aria-hidden
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${hex}26`, color: hex }}
        >
          <Sparkles className="h-7 w-7" />
        </span>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {accuracy === 100 ? "Perfect!" : "Done!"}
          </h2>
          <p className="text-muted-foreground">
            You got <strong className="text-foreground">{correctCount}</strong> out
            of <strong className="text-foreground">{total}</strong> right
            {accuracy < 100 && ` (${accuracy}%)`}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {missedCount > 0 && (
            <Button onClick={studyMissed}>
              <RotateCw className="mr-1 h-4 w-4" />
              Study {missedCount} missed
            </Button>
          )}
          <Button variant="outline" onClick={restart}>
            <RotateCw className="mr-1 h-4 w-4" />
            Restart all
          </Button>
          <Button variant="ghost" onClick={onExit}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Card {session.index + 1} of {total}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="rounded px-2 py-1 hover:bg-accent hover:text-accent-foreground"
          >
            End session
          </button>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full transition-all"
            style={{
              width: `${(session.index / total) * 100}%`,
              backgroundColor: hex,
            }}
          />
        </div>
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={flip}
        aria-label={session.flipped ? "Show front" : "Reveal answer"}
        className={cn(
          "flex min-h-[16rem] w-full flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-6 text-center transition-all sm:min-h-[20rem]",
          "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {session.flipped ? "Back" : "Front"}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-xl font-medium leading-snug sm:text-2xl">
          {session.flipped ? current!.back : current!.front}
        </p>
        {!session.flipped && (
          <p className="mt-6 text-xs text-muted-foreground">Tap to reveal</p>
        )}
      </button>

      {/* Answer buttons (only after reveal) */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          disabled={!session.flipped}
          onClick={() => answer(false)}
          className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
          Didn&apos;t know
        </Button>
        <Button
          size="lg"
          disabled={!session.flipped}
          onClick={() => answer(true)}
          className="gap-2 disabled:opacity-30"
        >
          <Check className="h-5 w-5" strokeWidth={2.5} />
          Knew it
        </Button>
      </div>
    </div>
  );
}

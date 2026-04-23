"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Layers,
  Pencil,
  Play,
  Plus,
} from "lucide-react";
import {
  FlashcardCardDialog,
  type CardDialogMode,
} from "@/components/flashcard-card-dialog";
import {
  FlashcardDeckDialog,
  type DeckDialogMode,
} from "@/components/flashcard-deck-dialog";
import { FlashcardStudy } from "@/components/flashcard-study";
import { Button } from "@/components/ui/button";
import { useDecksQuery } from "@/components/api/use-decks";
import { type Flashcard } from "@/lib/flashcards";
import { LESSON_COLORS } from "@/lib/timetable";

export default function FlashcardDeckPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <DeckGate key={id} id={id} />;
}

function DeckGate({ id }: { id: string }) {
  const decksQuery = useDecksQuery();

  if (decksQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  const deck = decksQuery.data?.find((d) => d.id === id);
  if (!deck) return <NotFound />;
  return <DeckPage id={id} deck={deck} />;
}

function DeckPage({
  id,
  deck,
}: {
  id: string;
  deck: NonNullable<ReturnType<typeof useDecksQuery>["data"]>[number];
}) {
  const [cardMode, setCardMode] = useState<CardDialogMode | null>(null);
  const [deckEditMode, setDeckEditMode] = useState<DeckDialogMode | null>(null);
  const [studying, setStudying] = useState(false);

  const color = LESSON_COLORS[deck.color ?? "neutral"];
  const cardCount = deck.cards.length;
  const canStudy = cardCount > 0;

  if (studying) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">{deck.title}</h1>
          <p className="text-xs text-muted-foreground">Study session</p>
        </header>
        <FlashcardStudy
          cards={deck.cards}
          color={deck.color ?? "neutral"}
          onExit={() => setStudying(false)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Button
          nativeButton={false}
          render={<Link href="/flashcards" />}
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          All decks
        </Button>
      </div>

      <header className="mb-6 flex items-start gap-3 border-b border-border pb-5">
        <span
          aria-hidden
          className="mt-1.5 h-8 w-1.5 rounded-full"
          style={{ backgroundColor: color.hex }}
        />
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {deck.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {cardCount} {cardCount === 1 ? "card" : "cards"}
            </span>
            {deck.subject && (
              <>
                <span aria-hidden>·</span>
                <span>{deck.subject}</span>
              </>
            )}
          </div>
          {deck.description && (
            <p className="text-sm text-muted-foreground">{deck.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeckEditMode({ kind: "edit", deck })}
          aria-label="Edit deck"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </header>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cards</h2>
          <p className="text-xs text-muted-foreground">
            Tap any card to edit it.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCardMode({ kind: "create" })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add card
          </Button>
          <Button
            disabled={!canStudy}
            onClick={() => setStudying(true)}
            title={canStudy ? undefined : "Add at least one card to study"}
          >
            <Play className="mr-1 h-4 w-4" />
            Study
          </Button>
        </div>
      </div>

      {cardCount === 0 ? (
        <EmptyCards onAdd={() => setCardMode({ kind: "create" })} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {deck.cards.map((c) => (
            <CardRow
              key={c.id}
              card={c}
              colorHex={color.hex}
              onEdit={() => setCardMode({ kind: "edit", card: c })}
            />
          ))}
        </div>
      )}

      {cardMode && (
        <FlashcardCardDialog
          key={cardMode.kind === "edit" ? `edit-${cardMode.card.id}` : "create"}
          open
          onOpenChange={(v) => {
            if (!v) setCardMode(null);
          }}
          deckId={id}
          mode={cardMode}
        />
      )}

      {deckEditMode && (
        <FlashcardDeckDialog
          key={deckEditMode.kind === "edit" ? `edit-${deckEditMode.deck.id}` : "create"}
          open
          onOpenChange={(v) => {
            if (!v) setDeckEditMode(null);
          }}
          mode={deckEditMode}
        />
      )}
    </div>
  );
}

function CardRow({
  card,
  colorHex,
  onEdit,
}: {
  card: Flashcard;
  colorHex: string;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Edit card: ${card.front}`}
      className="group flex items-stretch overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className="w-1 shrink-0"
        style={{ backgroundColor: colorHex }}
      />
      <div className="flex flex-1 flex-col gap-2 p-3 min-w-0">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Front
          </div>
          <p className="line-clamp-2 text-sm font-medium leading-snug whitespace-pre-wrap">
            {card.front}
          </p>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Back
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground leading-snug whitespace-pre-wrap">
            {card.back}
          </p>
        </div>
      </div>
    </button>
  );
}

function EmptyCards({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center transition-colors hover:border-primary/50 hover:text-foreground"
    >
      <Layers className="h-8 w-8 text-muted-foreground" />
      <div>
        <div className="font-semibold">No cards yet</div>
        <p className="text-sm text-muted-foreground">
          Tap to add your first card to this deck.
        </p>
      </div>
    </button>
  );
}

function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Deck not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The deck you&apos;re looking for has been deleted or never existed.
      </p>
      <Button
        nativeButton={false}
        render={<Link href="/flashcards" />}
        variant="outline"
        className="mt-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to decks
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Layers, Plus } from "lucide-react";
import { useDecks } from "@/components/api/use-decks";
import { FlashcardDeckCard } from "@/components/flashcard-deck-card";
import {
  FlashcardDeckDialog,
  type DeckDialogMode,
} from "@/components/flashcard-deck-dialog";
import { Button } from "@/components/ui/button";
import { compareDecksByUpdated } from "@/lib/flashcards";

export function FlashcardDeckList() {
  const decks = useDecks();
  const [mode, setMode] = useState<DeckDialogMode | null>(null);

  const sorted = [...decks].sort(compareDecksByUpdated);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {decks.length === 0
            ? "No decks yet."
            : `${decks.length} ${decks.length === 1 ? "deck" : "decks"}.`}
        </p>
        <Button onClick={() => setMode({ kind: "create" })}>
          <Plus className="mr-1 h-4 w-4" />
          New deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <EmptyState onCreate={() => setMode({ kind: "create" })} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {sorted.map((d) => (
            <FlashcardDeckCard key={d.id} deck={d} />
          ))}
        </div>
      )}

      {mode && (
        <FlashcardDeckDialog
          key={mode.kind === "edit" ? `edit-${mode.deck.id}` : "create"}
          open
          onOpenChange={(v) => {
            if (!v) setMode(null);
          }}
          mode={mode}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center transition-colors hover:border-primary/50 hover:text-foreground"
    >
      <Layers className="h-8 w-8 text-muted-foreground" />
      <div>
        <div className="font-semibold">No flashcard decks yet</div>
        <p className="text-sm text-muted-foreground">
          Tap to create your first deck of study cards.
        </p>
      </div>
    </button>
  );
}

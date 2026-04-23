import type { Metadata } from "next";
import { FlashcardDeckList } from "@/components/flashcard-deck-list";

export const metadata: Metadata = { title: "Flashcards" };

export default function FlashcardsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Flashcards</h1>
        <p className="text-muted-foreground">
          Study decks. Make a card with a question on the front and answer on
          the back, then flip through them to test yourself.
        </p>
      </header>
      <FlashcardDeckList />
    </div>
  );
}

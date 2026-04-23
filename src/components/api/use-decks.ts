"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Flashcard, FlashcardDeck } from "@/lib/flashcards";
import type { LessonColor } from "@/lib/timetable";

interface DbDeck {
  id: string;
  userId: string;
  title: string;
  subject: string | null;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  cards: Flashcard[];
}

function rowToDeck(row: DbDeck): FlashcardDeck {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject ?? undefined,
    description: row.description ?? undefined,
    color: (row.color as LessonColor | null) ?? undefined,
    cards: row.cards,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const EMPTY: FlashcardDeck[] = [];

export function useDecksQuery() {
  return useQuery<FlashcardDeck[]>({
    queryKey: ["decks"],
    queryFn: async () => {
      const res = await fetch("/api/decks", { credentials: "include" });
      if (res.status === 401) return EMPTY;
      if (!res.ok) throw new Error(`/api/decks ${res.status}`);
      const body = (await res.json()) as { decks: DbDeck[] };
      return body.decks.map(rowToDeck);
    },
    placeholderData: EMPTY,
  });
}

export function useDecks(): FlashcardDeck[] {
  return useDecksQuery().data ?? EMPTY;
}

export function useDeck(id: string): FlashcardDeck | undefined {
  return useDecks().find((d) => d.id === id);
}

/* ── Deck mutations ────────────────────────────────────────────────────── */

interface DeckBody {
  title: string;
  subject?: string;
  description?: string;
  color?: LessonColor;
}

function deckToBody(
  d: Omit<FlashcardDeck, "id" | "cards" | "createdAt" | "updatedAt">,
): DeckBody {
  return {
    title: d.title,
    subject: d.subject,
    description: d.description,
    color: d.color,
  };
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      d: Omit<FlashcardDeck, "id" | "cards" | "createdAt" | "updatedAt">,
    ) => {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(deckToBody(d)),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
      const body = (await res.json()) as { deck: DbDeck };
      return rowToDeck(body.deck);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
  });
}

export function useUpdateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: FlashcardDeck) => {
      const res = await fetch(`/api/decks/${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(deckToBody(d)),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/decks/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
  });
}

/* ── Card mutations (nested under deck) ────────────────────────────────── */

interface CardBody {
  front: string;
  back: string;
}

function cardToBody(c: Pick<Flashcard, "front" | "back">): CardBody {
  return { front: c.front, back: c.back };
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      deckId,
      card,
    }: {
      deckId: string;
      card: Pick<Flashcard, "front" | "back">;
    }) => {
      const res = await fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(cardToBody(card)),
      });
      if (!res.ok) throw new Error(`Create card failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      deckId,
      card,
    }: {
      deckId: string;
      card: Flashcard;
    }) => {
      const res = await fetch(`/api/decks/${deckId}/cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(cardToBody(card)),
      });
      if (!res.ok) throw new Error(`Update card failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      deckId,
      cardId,
    }: {
      deckId: string;
      cardId: string;
    }) => {
      const res = await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Delete card failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
  });
}

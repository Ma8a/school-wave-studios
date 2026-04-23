import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { flashcardDecks, flashcards } from "@/lib/schema";
import { getCurrentUser } from "@/lib/session";
import { newId } from "@/lib/auth-server";

const COLOR_KEYS = new Set([
  "amber",
  "ochre",
  "rust",
  "moss",
  "dusty-blue",
  "mauve",
  "neutral",
]);

interface DeckInput {
  title?: unknown;
  subject?: unknown;
  description?: unknown;
  color?: unknown;
}

function validateDeck(body: DeckInput): {
  ok: true;
  values: {
    title: string;
    subject: string | null;
    description: string | null;
    color: string | null;
  };
} | { ok: false; error: string } {
  const { title, subject, description, color } = body;
  if (typeof title !== "string" || title.trim().length === 0) {
    return { ok: false, error: "title is required." };
  }
  if (color !== undefined && color !== null && (typeof color !== "string" || !COLOR_KEYS.has(color))) {
    return { ok: false, error: "color is not a recognized palette key." };
  }
  return {
    ok: true,
    values: {
      title: title.trim(),
      subject: typeof subject === "string" && subject.trim() ? subject.trim() : null,
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      color: typeof color === "string" ? color : null,
    },
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Two-query stitch: pull decks, then cards-where-deckId-in-deckIds.
  // Cheaper than a JOIN here because the join would duplicate every deck
  // row N times (once per card).
  const deckRows = db
    .select()
    .from(flashcardDecks)
    .where(eq(flashcardDecks.userId, user.id))
    .all();

  const deckIds = deckRows.map((d) => d.id);
  const cardRows = deckIds.length
    ? db
        .select()
        .from(flashcards)
        .where(inArray(flashcards.deckId, deckIds))
        .orderBy(asc(flashcards.sortOrder))
        .all()
    : [];

  const cardsByDeck = new Map<string, typeof cardRows>();
  for (const card of cardRows) {
    const list = cardsByDeck.get(card.deckId) ?? [];
    list.push(card);
    cardsByDeck.set(card.deckId, list);
  }

  const decks = deckRows.map((d) => ({
    ...d,
    cards: (cardsByDeck.get(d.id) ?? []).map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
    })),
  }));

  return NextResponse.json({ decks });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const validation = validateDeck((body ?? {}) as DeckInput);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const id = newId();
  const now = new Date().toISOString();
  db.insert(flashcardDecks)
    .values({
      id,
      userId: user.id,
      ...validation.values,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const created = db
    .select()
    .from(flashcardDecks)
    .where(and(eq(flashcardDecks.id, id), eq(flashcardDecks.userId, user.id)))
    .get();
  return NextResponse.json({ deck: { ...created, cards: [] } });
}

export { validateDeck };

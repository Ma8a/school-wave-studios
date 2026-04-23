import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { flashcardDecks, flashcards } from "@/lib/schema";
import { getCurrentUser } from "@/lib/session";
import { validateCard } from "../route";

/** Verifies the deck exists AND belongs to the current user. */
function requireDeckOwnership(deckId: string, userId: string) {
  return db
    .select({ id: flashcardDecks.id })
    .from(flashcardDecks)
    .where(and(eq(flashcardDecks.id, deckId), eq(flashcardDecks.userId, userId)))
    .get();
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ deckId: string; cardId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { deckId, cardId } = await params;
  if (!requireDeckOwnership(deckId, user.id)) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const validation = validateCard(
    (body ?? {}) as Parameters<typeof validateCard>[0],
  );
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const result = db
    .update(flashcards)
    .set(validation.values)
    .where(and(eq(flashcards.id, cardId), eq(flashcards.deckId, deckId)))
    .run();
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.update(flashcardDecks)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(flashcardDecks.id, deckId))
    .run();

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ deckId: string; cardId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { deckId, cardId } = await params;
  if (!requireDeckOwnership(deckId, user.id)) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const result = db
    .delete(flashcards)
    .where(and(eq(flashcards.id, cardId), eq(flashcards.deckId, deckId)))
    .run();
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.update(flashcardDecks)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(flashcardDecks.id, deckId))
    .run();

  return NextResponse.json({ ok: true });
}

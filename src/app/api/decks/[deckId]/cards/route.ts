import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { flashcardDecks, flashcards } from "@/lib/schema";
import { getCurrentUser } from "@/lib/session";
import { newId } from "@/lib/auth-server";

interface CardInput {
  front?: unknown;
  back?: unknown;
}

function validateCard(body: CardInput): {
  ok: true;
  values: { front: string; back: string };
} | { ok: false; error: string } {
  const { front, back } = body;
  if (typeof front !== "string" || front.trim().length === 0) {
    return { ok: false, error: "front is required." };
  }
  if (typeof back !== "string" || back.trim().length === 0) {
    return { ok: false, error: "back is required." };
  }
  return { ok: true, values: { front: front.trim(), back: back.trim() } };
}

/** Confirms the deck exists AND belongs to the current user. */
function requireDeckOwnership(deckId: string, userId: string) {
  return db
    .select({ id: flashcardDecks.id })
    .from(flashcardDecks)
    .where(and(eq(flashcardDecks.id, deckId), eq(flashcardDecks.userId, userId)))
    .get();
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { deckId } = await params;
  if (!requireDeckOwnership(deckId, user.id)) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const validation = validateCard((body ?? {}) as CardInput);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Append-at-end ordering: read the current max sortOrder, add 1.
  const last = db
    .select({ sortOrder: flashcards.sortOrder })
    .from(flashcards)
    .where(eq(flashcards.deckId, deckId))
    .orderBy(desc(flashcards.sortOrder))
    .limit(1)
    .get();
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  const id = newId();
  db.insert(flashcards)
    .values({
      id,
      deckId,
      ...validation.values,
      sortOrder,
    })
    .run();

  // Bump the parent deck's updatedAt so the deck list re-sorts to put it first.
  db.update(flashcardDecks)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(flashcardDecks.id, deckId))
    .run();

  return NextResponse.json({
    card: { id, front: validation.values.front, back: validation.values.back },
  });
}

export { validateCard };

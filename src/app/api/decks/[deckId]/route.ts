import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { flashcardDecks } from "@/lib/schema";
import { getCurrentUser } from "@/lib/session";
import { validateDeck } from "../route";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { deckId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const validation = validateDeck(
    (body ?? {}) as Parameters<typeof validateDeck>[0],
  );
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const result = db
    .update(flashcardDecks)
    .set({ ...validation.values, updatedAt: new Date().toISOString() })
    .where(and(eq(flashcardDecks.id, deckId), eq(flashcardDecks.userId, user.id)))
    .run();
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { deckId } = await params;
  // The schema's onDelete: "cascade" wipes the deck's cards along with it.
  const result = db
    .delete(flashcardDecks)
    .where(and(eq(flashcardDecks.id, deckId), eq(flashcardDecks.userId, user.id)))
    .run();
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

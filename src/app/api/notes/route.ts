import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notes } from "@/lib/schema";
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

/**
 * Soft cap on note content size. 64 KB is ~64,000 characters — a Moby Dick
 * chapter, ~20 dense pages of school notes, or a LOT of pasted markdown.
 * Keeps a single runaway paste from blowing up the DB.
 *
 * ★ EDIT ME if your daughter hits this limit on a legitimate long note —
 * bump to 256 KB or 1 MB. Also worth revisiting if we ever support image
 * pasting (base64 inflates fast).
 */
const MAX_NOTE_CONTENT_BYTES = 64 * 1024;

interface NoteInput {
  title?: unknown;
  subject?: unknown;
  content?: unknown;
  color?: unknown;
}

function validateNote(body: NoteInput): {
  ok: true;
  values: {
    title: string;
    subject: string | null;
    content: string;
    color: string | null;
  };
} | { ok: false; error: string } {
  const { title, subject, content, color } = body;
  if (typeof title !== "string") {
    return { ok: false, error: "title must be a string." };
  }
  const cleanedContent = typeof content === "string" ? content : "";
  if (new TextEncoder().encode(cleanedContent).length > MAX_NOTE_CONTENT_BYTES) {
    return {
      ok: false,
      error: `Note content exceeds ${MAX_NOTE_CONTENT_BYTES} bytes.`,
    };
  }
  if (color !== undefined && color !== null && (typeof color !== "string" || !COLOR_KEYS.has(color))) {
    return { ok: false, error: "color is not a recognized palette key." };
  }
  return {
    ok: true,
    values: {
      title: title.trim() || "Untitled note",
      subject: typeof subject === "string" && subject.trim() ? subject.trim() : null,
      content: cleanedContent,
      color: typeof color === "string" ? color : null,
    },
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = db
    .select()
    .from(notes)
    .where(eq(notes.userId, user.id))
    .all();
  return NextResponse.json({ notes: rows });
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
  const validation = validateNote((body ?? {}) as NoteInput);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const id = newId();
  const now = new Date().toISOString();
  db.insert(notes)
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
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
    .get();
  return NextResponse.json({ note: created });
}

export { validateNote };

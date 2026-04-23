import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scoreEntries } from "@/lib/schema";
import { getCurrentUser } from "@/lib/session";
import { newId } from "@/lib/auth-server";

const TYPES = new Set(["plus", "minus", "remark"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface ScoreEntryInput {
  type?: unknown;
  date?: unknown;
  reason?: unknown;
  subject?: unknown;
  teacher?: unknown;
}

function validateScoreEntry(body: ScoreEntryInput): {
  ok: true;
  values: {
    type: string;
    date: string;
    reason: string | null;
    subject: string | null;
    teacher: string | null;
  };
} | { ok: false; error: string } {
  const { type, date, reason, subject, teacher } = body;
  if (typeof type !== "string" || !TYPES.has(type)) {
    return { ok: false, error: "type must be one of: plus, minus, remark." };
  }
  if (typeof date !== "string" || !DATE_RE.test(date)) {
    return { ok: false, error: "date must be YYYY-MM-DD." };
  }
  if (type === "remark" && (typeof reason !== "string" || reason.trim().length === 0)) {
    return { ok: false, error: "remark entries require a reason." };
  }
  return {
    ok: true,
    values: {
      type,
      date,
      reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
      subject: typeof subject === "string" && subject.trim() ? subject.trim() : null,
      teacher: typeof teacher === "string" && teacher.trim() ? teacher.trim() : null,
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
    .from(scoreEntries)
    .where(eq(scoreEntries.userId, user.id))
    .all();
  return NextResponse.json({ scoreEntries: rows });
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
  const validation = validateScoreEntry((body ?? {}) as ScoreEntryInput);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const id = newId();
  const createdAt = new Date().toISOString();
  db.insert(scoreEntries)
    .values({
      id,
      userId: user.id,
      ...validation.values,
      createdAt,
    })
    .run();

  const created = db
    .select()
    .from(scoreEntries)
    .where(and(eq(scoreEntries.id, id), eq(scoreEntries.userId, user.id)))
    .get();
  return NextResponse.json({ scoreEntry: created });
}

export { validateScoreEntry };

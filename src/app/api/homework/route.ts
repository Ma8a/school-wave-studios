import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { homework } from "@/lib/schema";
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface HomeworkInput {
  title?: unknown;
  subject?: unknown;
  dueDate?: unknown;
  description?: unknown;
  done?: unknown;
  doneAt?: unknown;
  color?: unknown;
}

function validateHomework(body: HomeworkInput): {
  ok: true;
  values: {
    title: string;
    subject: string | null;
    dueDate: string;
    description: string | null;
    done: boolean;
    doneAt: string | null;
    color: string | null;
  };
} | { ok: false; error: string } {
  const { title, subject, dueDate, description, done, doneAt, color } = body;
  if (typeof title !== "string" || title.trim().length === 0) {
    return { ok: false, error: "title is required." };
  }
  if (typeof dueDate !== "string" || !DATE_RE.test(dueDate)) {
    return { ok: false, error: "dueDate must be YYYY-MM-DD." };
  }
  if (done !== undefined && typeof done !== "boolean") {
    return { ok: false, error: "done must be boolean." };
  }
  if (color !== undefined && color !== null && (typeof color !== "string" || !COLOR_KEYS.has(color))) {
    return { ok: false, error: "color is not a recognized palette key." };
  }
  return {
    ok: true,
    values: {
      title: title.trim(),
      subject: typeof subject === "string" && subject.trim() ? subject.trim() : null,
      dueDate,
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      done: typeof done === "boolean" ? done : false,
      doneAt: typeof doneAt === "string" ? doneAt : null,
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
    .from(homework)
    .where(eq(homework.userId, user.id))
    .all();
  return NextResponse.json({ homework: rows });
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
  const validation = validateHomework((body ?? {}) as HomeworkInput);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const id = newId();
  const createdAt = new Date().toISOString();
  db.insert(homework)
    .values({
      id,
      userId: user.id,
      ...validation.values,
      createdAt,
    })
    .run();

  const created = db
    .select()
    .from(homework)
    .where(and(eq(homework.id, id), eq(homework.userId, user.id)))
    .get();
  return NextResponse.json({ homework: created });
}

export { validateHomework };

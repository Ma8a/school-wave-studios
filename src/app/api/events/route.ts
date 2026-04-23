import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { getCurrentUser } from "@/lib/session";
import { newId } from "@/lib/auth-server";

const TYPES = new Set(["test", "holiday", "trip", "event"]);
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

interface EventInput {
  type?: unknown;
  title?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  subject?: unknown;
  description?: unknown;
  color?: unknown;
}

function validateEvent(body: EventInput): {
  ok: true;
  values: {
    type: string;
    title: string;
    startDate: string;
    endDate: string;
    subject: string | null;
    description: string | null;
    color: string | null;
  };
} | { ok: false; error: string } {
  const { type, title, startDate, endDate, subject, description, color } = body;
  if (typeof type !== "string" || !TYPES.has(type)) {
    return { ok: false, error: "type must be one of: test, holiday, trip, event." };
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return { ok: false, error: "title is required." };
  }
  if (typeof startDate !== "string" || !DATE_RE.test(startDate)) {
    return { ok: false, error: "startDate must be YYYY-MM-DD." };
  }
  if (typeof endDate !== "string" || !DATE_RE.test(endDate)) {
    return { ok: false, error: "endDate must be YYYY-MM-DD." };
  }
  if (endDate < startDate) {
    return { ok: false, error: "endDate must be on or after startDate." };
  }
  if (color !== undefined && color !== null && (typeof color !== "string" || !COLOR_KEYS.has(color))) {
    return { ok: false, error: "color is not a recognized palette key." };
  }
  return {
    ok: true,
    values: {
      type,
      title: title.trim(),
      startDate,
      endDate,
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
  const rows = db
    .select()
    .from(events)
    .where(eq(events.userId, user.id))
    .all();
  return NextResponse.json({ events: rows });
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
  const validation = validateEvent((body ?? {}) as EventInput);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const id = newId();
  const createdAt = new Date().toISOString();
  db.insert(events)
    .values({
      id,
      userId: user.id,
      ...validation.values,
      createdAt,
    })
    .run();

  const created = db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, user.id)))
    .get();
  return NextResponse.json({ event: created });
}

export { validateEvent };

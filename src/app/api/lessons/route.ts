import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessons } from "@/lib/schema";
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

const HHMM_RE = /^\d{2}:\d{2}$/;

interface LessonInput {
  day?: unknown;
  week?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  subject?: unknown;
  teacher?: unknown;
  room?: unknown;
  color?: unknown;
  notes?: unknown;
}

function validateLesson(body: LessonInput): {
  ok: true;
  values: {
    day: number;
    week: number;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string | null;
    room: string | null;
    color: string | null;
    notes: string | null;
  };
} | { ok: false; error: string } {
  const { day, week, startTime, endTime, subject, teacher, room, color, notes } = body;
  if (typeof day !== "number" || !Number.isInteger(day) || day < 1 || day > 7) {
    return { ok: false, error: "day must be an integer 1–7." };
  }
  // `week` is optional and defaults to 1 (Week 1) for older clients.
  let weekValue = 1;
  if (week !== undefined) {
    if (week !== 1 && week !== 2) {
      return { ok: false, error: "week must be 1 (Week 1) or 2 (Week 2)." };
    }
    weekValue = week;
  }
  if (typeof startTime !== "string" || !HHMM_RE.test(startTime)) {
    return { ok: false, error: "startTime must be HH:mm." };
  }
  if (typeof endTime !== "string" || !HHMM_RE.test(endTime)) {
    return { ok: false, error: "endTime must be HH:mm." };
  }
  if (typeof subject !== "string" || subject.trim().length === 0) {
    return { ok: false, error: "subject is required." };
  }
  if (color !== undefined && color !== null && (typeof color !== "string" || !COLOR_KEYS.has(color))) {
    return { ok: false, error: "color is not a recognized palette key." };
  }
  return {
    ok: true,
    values: {
      day,
      week: weekValue,
      startTime,
      endTime,
      subject: subject.trim(),
      teacher: typeof teacher === "string" && teacher.trim() ? teacher.trim() : null,
      room: typeof room === "string" && room.trim() ? room.trim() : null,
      color: typeof color === "string" ? color : null,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
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
    .from(lessons)
    .where(eq(lessons.userId, user.id))
    .all();
  return NextResponse.json({ lessons: rows });
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
  const validation = validateLesson((body ?? {}) as LessonInput);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const id = newId();
  db.insert(lessons)
    .values({ id, userId: user.id, ...validation.values })
    .run();

  const created = db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, id), eq(lessons.userId, user.id)))
    .get();
  return NextResponse.json({ lesson: created });
}

export { validateLesson };

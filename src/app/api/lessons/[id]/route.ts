import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessons } from "@/lib/schema";
import { getCurrentUser } from "@/lib/session";
import { validateLesson } from "../route";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const validation = validateLesson(
    (body ?? {}) as Parameters<typeof validateLesson>[0],
  );
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const result = db
    .update(lessons)
    .set(validation.values)
    .where(and(eq(lessons.id, id), eq(lessons.userId, user.id)))
    .run();
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, id), eq(lessons.userId, user.id)))
    .get();
  return NextResponse.json({ lesson: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const result = db
    .delete(lessons)
    .where(and(eq(lessons.id, id), eq(lessons.userId, user.id)))
    .run();
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

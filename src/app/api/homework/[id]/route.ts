import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { homework } from "@/lib/schema";
import { getCurrentUser } from "@/lib/session";
import { validateHomework } from "../route";

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
  const validation = validateHomework(
    (body ?? {}) as Parameters<typeof validateHomework>[0],
  );
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const result = db
    .update(homework)
    .set(validation.values)
    .where(and(eq(homework.id, id), eq(homework.userId, user.id)))
    .run();
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = db
    .select()
    .from(homework)
    .where(and(eq(homework.id, id), eq(homework.userId, user.id)))
    .get();
  return NextResponse.json({ homework: updated });
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
    .delete(homework)
    .where(and(eq(homework.id, id), eq(homework.userId, user.id)))
    .run();
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

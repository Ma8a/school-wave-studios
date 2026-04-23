import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import {
  clearSessionCookie,
  getCurrentUser,
  getSessionIdFromCookie,
  deleteSession,
} from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}

/**
 * PATCH — update mutable profile fields. Accepts either `name` or
 * `currentWeek` (or both). At least one must be present.
 *
 * `currentWeek` flips between 1 (Week 1) and 2 (Week 2) for the fortnightly
 * timetable. The user does this manually at the start of each new fortnight.
 */
export async function PATCH(req: Request) {
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
  const { name, currentWeek } = (body ?? {}) as {
    name?: unknown;
    currentWeek?: unknown;
  };

  const updates: Partial<{ name: string; currentWeek: number }> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    updates.name = name.trim();
  }

  if (currentWeek !== undefined) {
    if (currentWeek !== 1 && currentWeek !== 2) {
      return NextResponse.json(
        { error: "currentWeek must be 1 or 2." },
        { status: 400 },
      );
    }
    updates.currentWeek = currentWeek;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update." },
      { status: 400 },
    );
  }

  db.update(users).set(updates).where(eq(users.id, user.id)).run();

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: updates.name ?? user.name,
      currentWeek:
        updates.currentWeek !== undefined
          ? ((updates.currentWeek === 2 ? 2 : 1) as 1 | 2)
          : user.currentWeek,
    },
  });
}

/**
 * DELETE — delete the current user's account entirely.
 * ON DELETE CASCADE wipes every row in every other table belonging to this
 * user, so no orphan data is left behind. Clears the session cookie too so
 * the next request bounces to the login screen.
 */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = await getSessionIdFromCookie();
  if (sessionId) await deleteSession(sessionId);

  db.delete(users).where(eq(users.id, user.id)).run();
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}

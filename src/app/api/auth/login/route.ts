import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { verifyPin } from "@/lib/auth-server";
import { createSession, setSessionCookie } from "@/lib/session";
import { isValidPinFormat } from "@/lib/auth";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { username, pin } = (body ?? {}) as Record<string, unknown>;

  if (typeof username !== "string" || username.length === 0) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }
  if (typeof pin !== "string" || !isValidPinFormat(pin)) {
    return NextResponse.json(
      { error: "Invalid username or PIN." },
      { status: 401 },
    );
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .get();

  // Always run verifyPin even if the user doesn't exist, so timing of the
  // 401 doesn't reveal whether the username was real.
  const ok = user
    ? await verifyPin(pin, user.pinHash, user.salt)
    : await verifyPin(pin, "00".repeat(64), "00".repeat(16));

  if (!user || !ok) {
    return NextResponse.json(
      { error: "Invalid username or PIN." },
      { status: 401 },
    );
  }

  const sessionId = await createSession(user.id);
  await setSessionCookie(sessionId);

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      currentWeek: (user.currentWeek === 2 ? 2 : 1) as 1 | 2,
    },
  });
}

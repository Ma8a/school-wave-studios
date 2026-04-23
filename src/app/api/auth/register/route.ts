import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPin, newId } from "@/lib/auth-server";
import { createSession, setSessionCookie } from "@/lib/session";
import { isValidPinFormat, PIN_LENGTH } from "@/lib/auth";

const USERNAME_RE = /^[a-z0-9_-]{3,24}$/i;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { username, name, pin } = (body ?? {}) as Record<string, unknown>;

  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3–24 letters, numbers, dashes or underscores.",
      },
      { status: 400 },
    );
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (typeof pin !== "string" || !isValidPinFormat(pin)) {
    return NextResponse.json(
      { error: `PIN must be exactly ${PIN_LENGTH} digits.` },
      { status: 400 },
    );
  }

  // Username uniqueness — also enforced by the UNIQUE constraint, but a clean
  // 409 reads better than a raw SQL error.
  const taken = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .get();
  if (taken) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 },
    );
  }

  const { hash, salt } = await hashPin(pin);
  const id = newId();
  db.insert(users)
    .values({
      id,
      username: username.toLowerCase(),
      name: name.trim(),
      pinHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    })
    .run();

  const sessionId = await createSession(id);
  await setSessionCookie(sessionId);

  return NextResponse.json({
    user: {
      id,
      username: username.toLowerCase(),
      name: name.trim(),
      currentWeek: 1,
    },
  });
}

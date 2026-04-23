import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPin, verifyPin } from "@/lib/auth-server";
import { getCurrentUser } from "@/lib/session";
import { isValidPinFormat, PIN_LENGTH } from "@/lib/auth";

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
  const { currentPin, newPin } = (body ?? {}) as {
    currentPin?: unknown;
    newPin?: unknown;
  };

  if (typeof currentPin !== "string" || typeof newPin !== "string") {
    return NextResponse.json({ error: "Invalid PIN payload." }, { status: 400 });
  }
  if (!isValidPinFormat(newPin)) {
    return NextResponse.json(
      { error: `New PIN must be exactly ${PIN_LENGTH} digits.` },
      { status: 400 },
    );
  }

  // Re-fetch the user's hash + salt from the DB — the session object doesn't
  // carry them, on purpose (limits blast radius if a session is ever leaked).
  const row = db
    .select({ pinHash: users.pinHash, salt: users.salt })
    .from(users)
    .where(eq(users.id, user.id))
    .get();
  if (!row) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const ok = await verifyPin(currentPin, row.pinHash, row.salt);
  if (!ok) {
    return NextResponse.json(
      { error: "Current PIN is incorrect." },
      { status: 401 },
    );
  }

  const { hash, salt } = await hashPin(newPin);
  db.update(users)
    .set({ pinHash: hash, salt })
    .where(eq(users.id, user.id))
    .run();

  return NextResponse.json({ ok: true });
}

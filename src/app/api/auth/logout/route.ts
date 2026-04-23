import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  deleteSession,
  getSessionIdFromCookie,
} from "@/lib/session";

export async function POST() {
  const sessionId = await getSessionIdFromCookie();
  if (sessionId) await deleteSession(sessionId);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

import "server-only";

import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "./db";
import { sessions, users } from "./schema";
import { newSessionId } from "./auth-server";

const COOKIE_NAME = "sws_session";
const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  /** 1 = Week 1, 2 = Week 2 — drives which fortnight half Today shows. */
  currentWeek: 1 | 2;
}

/** Insert a new session row and return its ID. */
export async function createSession(userId: string): Promise<string> {
  const id = newSessionId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db.insert(sessions)
    .values({
      id,
      userId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })
    .run();
  return id;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Reads the cookie, looks the session up in the DB, joins the user, and
 * returns the SessionUser if the session is valid and not expired.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const now = new Date().toISOString();
  const row = db
    .select({
      userId: users.id,
      username: users.username,
      name: users.name,
      currentWeek: users.currentWeek,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .get();

  return row
    ? {
        id: row.userId,
        username: row.username,
        name: row.name,
        currentWeek: (row.currentWeek === 2 ? 2 : 1) as 1 | 2,
      }
    : null;
}

/** Delete a session row by ID. Use on logout. */
export async function deleteSession(sessionId: string): Promise<void> {
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

/** Read just the cookie (for logout flow that needs to look up the row). */
export async function getSessionIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

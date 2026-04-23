import "server-only";

import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

/**
 * scrypt is in Node's stdlib (no extra deps), is memory-hard, and is the
 * recommended modern choice for password hashing alongside argon2id. We use
 * the default cost parameters which are tuned to take ~50–100 ms on a modern
 * server — slow enough that brute-forcing a 4-digit PIN offline still takes
 * tens of minutes.
 */
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export async function hashPin(
  pin: string,
): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = await scrypt(pin, salt, KEY_LENGTH);
  return { hash: derived.toString("hex"), salt };
}

export async function verifyPin(
  pin: string,
  storedHash: string,
  storedSalt: string,
): Promise<boolean> {
  const derived = await scrypt(pin, storedSalt, KEY_LENGTH);
  const stored = Buffer.from(storedHash, "hex");
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}

export function newId(): string {
  return crypto.randomUUID();
}

export function newSessionId(): string {
  // 32 random bytes (256 bits) hex-encoded → 64-char session ID. Plenty of
  // entropy to make guessing infeasible.
  return randomBytes(32).toString("hex");
}

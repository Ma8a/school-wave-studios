/**
 * PIN-based local authentication.
 *
 * Threat model: a casual snooper (sibling, classmate) who briefly grabs the
 * device. Not a determined attacker with developer tools and an offline copy
 * of localStorage. We use PBKDF2 to make brute-force expensive *enough* that
 * even if someone exports localStorage, cracking a 4-digit PIN takes serious
 * time, but we don't pretend this is bank-grade security.
 *
 * Web Crypto requires a "secure context" (HTTPS or localhost). When deployed
 * behind certbot on the VPS, both are satisfied.
 */

/**
 * ★ EDIT ME if you want a longer PIN.
 * Set to 6 (or 8) for stronger security at the cost of slightly more typing.
 * The PinInput component and dialogs all read this constant, so changing it
 * here adapts the entire UI automatically.
 */
export const PIN_LENGTH = 4;

/**
 * Iterations of PBKDF2 hashing. ~100k takes about 100ms on modern phones —
 * imperceptible to the user but slow enough to make offline brute-force of a
 * 4-digit PIN take ~17+ minutes (10,000 guesses × 100ms).
 */
const PBKDF2_ITERATIONS = 100_000;

export interface PinRecord {
  saltHex: string;
  hashHex: string;
  /** ISO datetime when this PIN was set. */
  setAt: string;
}

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Returns Uint8Array backed by a plain ArrayBuffer (not SharedArrayBuffer).
 * TypeScript 5.7+ requires this distinction for Web Crypto APIs that take
 * a strict `BufferSource`.
 */
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

export async function hashPin(pin: string, saltHex: string): Promise<string> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function createPinRecord(pin: string): Promise<PinRecord> {
  const saltHex = generateSalt();
  const hashHex = await hashPin(pin, saltHex);
  return { saltHex, hashHex, setAt: new Date().toISOString() };
}

/**
 * Verify a candidate PIN against a stored record using a constant-time
 * comparison so timing differences can't leak information about which digit
 * was wrong.
 */
export async function verifyPin(
  pin: string,
  record: PinRecord,
): Promise<boolean> {
  const candidate = await hashPin(pin, record.saltHex);
  if (candidate.length !== record.hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ record.hashHex.charCodeAt(i);
  }
  return diff === 0;
}

export function isValidPinFormat(pin: string): boolean {
  return new RegExp(`^[0-9]{${PIN_LENGTH}}$`).test(pin);
}

export function isValidPinRecord(r: unknown): r is PinRecord {
  if (!r || typeof r !== "object") return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.saltHex === "string" &&
    typeof x.hashHex === "string" &&
    typeof x.setAt === "string"
  );
}

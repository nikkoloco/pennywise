import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password and PIN hashing. Node-only: never import this from proxy.ts, which
 * runs where node:crypto cannot load. See lib/session.ts.
 */

export function hashSecret(secret: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(secret, salt, 64).toString("hex")}`;
}

export function verifySecret(secret: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  const derived = scryptSync(secret, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  // Constant time, so a wrong guess never leaks how wrong it was.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Escalating lockout: the first few slips are free, then it gets expensive. */
export function lockoutFor(attempts: number) {
  if (attempts < 5) return null;
  return new Date(Date.now() + Math.min(60, 2 ** (attempts - 5)) * 60_000);
}

/** How much of a lockout is left, in whole minutes, never rounded down to none. */
export function minutesLeft(until: Date) {
  return Math.max(1, Math.ceil((+until - Date.now()) / 60_000));
}

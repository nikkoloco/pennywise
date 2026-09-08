import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Node-only. Never import this from middleware; see lib/session.ts. */

export function hashPin(pin: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(pin, salt, 64).toString("hex")}`;
}

export function verifyPin(pin: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  const derived = scryptSync(pin, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  // Constant time, so a wrong PIN never leaks how wrong it was.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Escalating lockout: the first few slips are free, then it gets expensive. */
export function lockoutFor(attempts: number) {
  if (attempts < 5) return null;
  return new Date(Date.now() + Math.min(60, 2 ** (attempts - 5)) * 60_000);
}

import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-safe session handling. Kept free of node:crypto on purpose: proxy.ts
 * runs on the edge runtime, and importing password hashing here would drag a
 * native module into a place that cannot load it.
 *
 * A session carries two facts. `sub` is who you are, proven by a password at
 * sign-in and good for a month. `unlocked` is whether the app is open right
 * now, which the PIN answers. Both live in the one cookie because locking is
 * not signing out: it clears the second without touching the first, so the PIN
 * pad is all that stands between a locked phone and the log.
 */

const ALG = "HS256";
const SESSION_DAYS = 30;

export const SESSION_COOKIE = "pennywise_session";
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export type Session = { userId: string; unlocked: boolean };

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function signSession(userId: string, unlocked: boolean) {
  return new SignJWT({ sub: userId, unlocked })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function readSessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    if (typeof payload.sub !== "string") return null;
    return { userId: payload.sub, unlocked: payload.unlocked === true };
  } catch {
    return null;
  }
}

import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-safe session handling. Kept free of node:crypto on purpose: middleware
 * runs on the edge runtime, and importing PIN hashing here would drag a native
 * module into a place that cannot load it.
 */

const ALG = "HS256";
const SESSION_DAYS = 30;

export const SESSION_COOKIE = "pennywise_session";
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function signSession(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function readSessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

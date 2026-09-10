import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "./session";

/**
 * Writing the session cookie. Split from lib/session.ts because that file is
 * imported by the proxy, and next/headers cannot go there.
 */

export async function startSession(userId: string, unlocked: boolean) {
  (await cookies()).set(SESSION_COOKIE, await signSession(userId, unlocked), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

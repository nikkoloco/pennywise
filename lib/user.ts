import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE, readSessionToken } from "./session";

/**
 * The signed-in user's id, read straight out of the session cookie. The cookie
 * is signed, so the id inside it is exactly as trustworthy as a row lookup
 * would be, and it costs no database round trip. That matters: this is the
 * first await on every page and every action, so a query here would sit in
 * front of all the real work rather than run alongside it.
 *
 * Middleware already turned away unauthenticated requests, so reaching here
 * without a session is a bug rather than a case to handle politely.
 */
export const currentUserId = cache(async () => {
  const userId = await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) throw new Error("No session");
  return userId;
});

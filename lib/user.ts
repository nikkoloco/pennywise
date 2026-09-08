import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, readSessionToken } from "./session";

/**
 * The signed-in user, resolved from the session cookie. Middleware already
 * turned away unauthenticated requests, so reaching here without a session is a
 * bug rather than a case to handle politely.
 */
export const currentUser = cache(async () => {
  const userId = await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) throw new Error("No session");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("Session points at a missing user");
  return user;
});

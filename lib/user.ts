import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Pennywise has one user. Phase 8 swaps this for a session lookup; everything
 * downstream already takes a userId, so nothing else changes.
 */
export const currentUser = cache(async () => {
  const [user] = await db.select().from(users).limit(1);
  return user;
});

"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashSecret, lockoutFor, minutesLeft, verifySecret } from "@/lib/credentials";
import { startSession } from "@/lib/sessionCookie";
import { currentUserId } from "@/lib/user";

/**
 * The PIN. It never proves who you are, the password did that at sign-in; it
 * only decides whether the app is open on this phone. So everything here acts
 * on the account already in the session, and locking rewrites that session
 * rather than throwing it away.
 *
 * A PIN is optional. Forgetting one is not a dead end either: sign out, sign
 * back in with the password, and turn it off in Settings.
 */

const pinSchema = z.string().regex(/^\d{6}$/);

export type UnlockResult = { ok: true } | { ok: false; message: string };

async function pinState(userId: string) {
  const [user] = await db
    .select({
      pinHash: users.pinHash,
      failed: users.pinFailedAttempts,
      lockedUntil: users.pinLockedUntil,
    })
    .from(users)
    .where(eq(users.id, userId));
  return user;
}

export async function setPin(pin: string): Promise<UnlockResult> {
  const userId = await currentUserId();

  const parsed = pinSchema.safeParse(pin);
  if (!parsed.success) return { ok: false, message: "Six digits." };

  const user = await pinState(userId);
  if (user.pinHash) return { ok: false, message: "A PIN is already set." };

  await db.update(users).set({ pinHash: hashSecret(parsed.data) }).where(eq(users.id, userId));

  await startSession(userId, true);
  return { ok: true };
}

export async function unlock(pin: string): Promise<UnlockResult> {
  const userId = await currentUserId();

  const parsed = pinSchema.safeParse(pin);
  if (!parsed.success) return { ok: false, message: "Six digits." };

  const user = await pinState(userId);
  if (!user.pinHash) return { ok: false, message: "No PIN set yet." };

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = minutesLeft(user.lockedUntil);
    return { ok: false, message: `Locked for ${minutes} more minute${minutes === 1 ? "" : "s"}.` };
  }

  if (!verifySecret(parsed.data, user.pinHash)) {
    const attempts = user.failed + 1;
    await db
      .update(users)
      .set({ pinFailedAttempts: attempts, pinLockedUntil: lockoutFor(attempts) })
      .where(eq(users.id, userId));

    const left = 5 - attempts;
    return {
      ok: false,
      message: left > 0 ? `Wrong PIN. ${left} left.` : "Too many attempts. Locked.",
    };
  }

  await db
    .update(users)
    .set({ pinFailedAttempts: 0, pinLockedUntil: null })
    .where(eq(users.id, userId));

  await startSession(userId, true);
  return { ok: true };
}

/** Turning the PIN off. Only reachable from Settings, which needs the app open. */
export async function clearPin() {
  const userId = await currentUserId();
  await db
    .update(users)
    .set({ pinHash: null, pinFailedAttempts: 0, pinLockedUntil: null })
    .where(eq(users.id, userId));
}

/** Locking is not signing out: the session keeps who you are, and loses only
 *  the fact that the app was open. */
export async function lockNow() {
  await startSession(await currentUserId(), false);
}

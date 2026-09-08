"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPin, lockoutFor, verifyPin } from "@/lib/pin";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";

const pinSchema = z.string().regex(/^\d{6}$/);

async function soleUser() {
  const [user] = await db.select().from(users).limit(1);
  return user;
}

async function startSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export type UnlockResult = { ok: true } | { ok: false; message: string };

/** First run only: claims the PIN if the account does not have one yet. */
export async function setPin(pin: string): Promise<UnlockResult> {
  const parsed = pinSchema.safeParse(pin);
  if (!parsed.success) return { ok: false, message: "Six digits." };

  const user = await soleUser();
  if (user.pinHash) return { ok: false, message: "A PIN is already set." };

  await db
    .update(users)
    .set({ pinHash: hashPin(parsed.data) })
    .where(eq(users.id, user.id));

  await startSession(user.id);
  return { ok: true };
}

export async function unlock(pin: string): Promise<UnlockResult> {
  const parsed = pinSchema.safeParse(pin);
  if (!parsed.success) return { ok: false, message: "Six digits." };

  const user = await soleUser();
  if (!user.pinHash) return { ok: false, message: "No PIN set yet." };

  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
    const minutes = Math.ceil((+user.pinLockedUntil - Date.now()) / 60_000);
    return { ok: false, message: `Locked for ${minutes} more minute${minutes === 1 ? "" : "s"}.` };
  }

  if (!verifyPin(parsed.data, user.pinHash)) {
    const attempts = user.pinFailedAttempts + 1;
    await db
      .update(users)
      .set({ pinFailedAttempts: attempts, pinLockedUntil: lockoutFor(attempts) })
      .where(eq(users.id, user.id));

    const left = 5 - attempts;
    return {
      ok: false,
      message: left > 0 ? `Wrong PIN. ${left} left.` : "Too many attempts. Locked.",
    };
  }

  await db
    .update(users)
    .set({ pinFailedAttempts: 0, pinLockedUntil: null })
    .where(eq(users.id, user.id));

  await startSession(user.id);
  return { ok: true };
}

export async function lockNow() {
  (await cookies()).delete(SESSION_COOKIE);
}

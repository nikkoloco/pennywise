"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { provisionUser } from "@/db/provision";
import { users } from "@/db/schema";
import { hashSecret, lockoutFor, minutesLeft, verifySecret } from "@/lib/credentials";
import { clearSession, startSession } from "@/lib/sessionCookie";
import { currentUserId } from "@/lib/user";

/**
 * Accounts. A password proves who you are and lasts a month; the PIN in
 * lock-actions.ts only decides whether the app is open on this phone.
 *
 * Sign-up needs an invite code because the app lives on a public URL and a
 * free database. Without SIGNUP_INVITE_CODE set, sign-up is simply closed.
 */

const credentials = z.object({
  email: z.email().max(120),
  password: z.string().min(8).max(200),
});

export type AuthResult = { ok: true } | { ok: false; message: string };

/** One message for every way a sign-in can fail, so none of them tells a
 *  stranger which half they got right. */
const WRONG = "Wrong email or password.";

const BAD_FORM = "Enter an email and a password of at least 8 characters.";

const TAKEN = "That email already has an account.";

function read(email: string, password: string) {
  return credentials.safeParse({ email: email.trim().toLowerCase(), password });
}

async function emailOwner(email: string) {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  return row?.id ?? null;
}

export async function signUp(
  email: string,
  password: string,
  invite: string,
): Promise<AuthResult> {
  const code = process.env.SIGNUP_INVITE_CODE;
  if (!code) return { ok: false, message: "Sign-up is closed." };
  if (invite.trim() !== code) return { ok: false, message: "That invite code is not right." };

  const parsed = read(email, password);
  if (!parsed.success) return { ok: false, message: BAD_FORM };

  if (await emailOwner(parsed.data.email)) return { ok: false, message: TAKEN };

  const [user] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash: hashSecret(parsed.data.password),
    })
    .returning({ id: users.id });

  // A new account with no categories has nothing to tap, so it starts with the
  // same defaults the seed script gives.
  await provisionUser(user.id);

  await startSession(user.id, true);
  return { ok: true };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const parsed = read(email, password);
  if (!parsed.success) return { ok: false, message: WRONG };

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  if (!user?.passwordHash) return { ok: false, message: WRONG };

  if (user.passwordLockedUntil && user.passwordLockedUntil > new Date()) {
    const minutes = minutesLeft(user.passwordLockedUntil);
    return {
      ok: false,
      message: `Too many tries. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  if (!verifySecret(parsed.data.password, user.passwordHash)) {
    const attempts = user.passwordFailedAttempts + 1;
    await db
      .update(users)
      .set({ passwordFailedAttempts: attempts, passwordLockedUntil: lockoutFor(attempts) })
      .where(eq(users.id, user.id));
    return { ok: false, message: WRONG };
  }

  await db
    .update(users)
    .set({ passwordFailedAttempts: 0, passwordLockedUntil: null })
    .where(eq(users.id, user.id));

  // The password has just proved who you are, so the app opens. The PIN only
  // matters from the next lock onwards.
  await startSession(user.id, true);
  return { ok: true };
}

/**
 * Sets the email and password on the account already signed in.
 *
 * This is how the very first account, made by the seed script back when the
 * app had one user, gains a login without a single row moving: it keeps its id,
 * so every expense, event and recurring payment stays exactly where it is. It
 * is also how anyone changes their email or password afterwards.
 */
export async function setCredentials(email: string, password: string): Promise<AuthResult> {
  const userId = await currentUserId();

  const parsed = read(email, password);
  if (!parsed.success) return { ok: false, message: BAD_FORM };

  const owner = await emailOwner(parsed.data.email);
  if (owner && owner !== userId) return { ok: false, message: TAKEN };

  await db
    .update(users)
    .set({
      email: parsed.data.email,
      passwordHash: hashSecret(parsed.data.password),
      passwordFailedAttempts: 0,
      passwordLockedUntil: null,
    })
    .where(eq(users.id, userId));

  return { ok: true };
}

export async function signOut() {
  await clearSession();
}

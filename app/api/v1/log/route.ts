import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { apiAttempts, apiTokens, categories, expenses } from "@/db/schema";
import { hashToken } from "@/lib/tokens";

/**
 * The only public surface Pennywise exposes. Apple Shortcuts posts here, which
 * is what makes logging work from the Lock Screen, the Action Button, Back Tap
 * and Siri. A Shortcut on a phone is awkward to update, so this contract is
 * versioned and meant to stay put.
 *
 * Every request is recorded, success or failure. A Shortcut that fails from a
 * locked phone reports nothing, so without this trail there is no way to tell a
 * wrong token from a wrong category from a request that never arrived.
 */

const bodySchema = z.object({
  /** Pesos, as a number or a string like "250", "₱250.50" or "1,250". */
  amount: z.union([z.number(), z.string()]),
  /** Category name, matched case-insensitively. */
  category: z.string().min(1),
  note: z.string().max(140).optional(),
  /** Accepted here as well as in the Authorization header. */
  token: z.string().optional(),
  source: z.enum(["shortcut", "siri"]).default("shortcut"),
});

function toMinor(input: number | string) {
  const value =
    typeof input === "number" ? input : Number(String(input).replace(/[^0-9.]/g, ""));
  return Math.round(value * 100);
}

/** Keeps the diagnostic trail to the last 50 rows rather than growing forever. */
async function record(status: number, message: string, userId: string | null = null) {
  await db.insert(apiAttempts).values({ status, message, userId });

  const stale = await db
    .select({ id: apiAttempts.id })
    .from(apiAttempts)
    .orderBy(desc(apiAttempts.at))
    .offset(50);

  if (stale.length > 0) {
    await db.delete(apiAttempts).where(inArray(apiAttempts.id, stale.map((r) => r.id)));
  }
}

function fail(status: number, message: string, extra: object = {}) {
  return Response.json({ ok: false, error: message, ...extra }, { status });
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    const message = `Body is missing or wrong: ${missing || "not valid JSON"}`;
    await record(400, message);
    return fail(400, message, { expected: { amount: 250, category: "Food" } });
  }

  // The scheme is case-insensitive per HTTP, and the body is accepted too so a
  // Shortcut can skip headers entirely.
  const header = request.headers.get("authorization") ?? "";
  const fromHeader = /^bearer\s+/i.test(header) ? header.replace(/^bearer\s+/i, "") : "";
  const token = (fromHeader || parsed.data.token || "").trim();

  if (!token) {
    const message = "No token. Send it as a `token` field, or a Bearer header.";
    await record(401, message);
    return fail(401, message);
  }

  const [auth] = await db
    .select({ id: apiTokens.id, userId: apiTokens.userId, name: apiTokens.name })
    .from(apiTokens)
    .where(and(eq(apiTokens.tokenHash, hashToken(token)), isNull(apiTokens.revokedAt)))
    .limit(1);

  if (!auth) {
    const message = "Token not recognised. It may be mistyped, cut short, or revoked.";
    await record(401, message);
    return fail(401, message);
  }

  const amountMinor = toMinor(parsed.data.amount);
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    const message = `Amount "${parsed.data.amount}" is not a positive number.`;
    await record(400, message, auth.userId);
    return fail(400, message);
  }

  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(
      and(
        eq(categories.userId, auth.userId),
        eq(categories.isArchived, false),
        sql`lower(${categories.name}) = lower(${parsed.data.category})`,
      ),
    )
    .limit(1);

  if (!category) {
    const available = await db
      .select({ name: categories.name })
      .from(categories)
      .where(and(eq(categories.userId, auth.userId), eq(categories.isArchived, false)));

    const message = `No category called "${parsed.data.category}".`;
    await record(400, message, auth.userId);
    return fail(400, message, { available: available.map((c) => c.name) });
  }

  await db.insert(expenses).values({
    userId: auth.userId,
    categoryId: category.id,
    amountMinor,
    note: parsed.data.note?.trim() || null,
    spentAt: new Date(),
    source: parsed.data.source,
  });

  await db
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, auth.id));

  const summary = `Logged ${(amountMinor / 100).toFixed(2)} to ${category.name}`;
  await record(200, summary, auth.userId);

  revalidatePath("/");
  revalidatePath("/events");

  return Response.json({ ok: true, message: summary, amountMinor, category: category.name });
}

/** A Shortcut left on the default method lands here. Say so, rather than 405. */
export async function GET() {
  const message = "This endpoint needs POST. In Shortcuts, set Method to POST.";
  await record(405, message);
  return fail(405, message);
}

export const dynamic = "force-dynamic";

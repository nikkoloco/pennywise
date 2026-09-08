import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { apiTokens, categories, expenses } from "@/db/schema";
import { hashToken } from "@/lib/tokens";

/**
 * The only public surface Pennywise exposes. Apple Shortcuts posts here, which
 * is what makes logging work from the Lock Screen, the Action Button, Back Tap
 * and Siri. A Shortcut on a phone is awkward to update, so this contract is
 * versioned and meant to stay put.
 */

const bodySchema = z.object({
  /** Pesos, as a number or a string like "250", "₱250.50" or "1,250". */
  amount: z.union([z.number(), z.string()]),
  /** Category name, matched case-insensitively. */
  category: z.string().min(1),
  note: z.string().max(140).optional(),
  source: z.enum(["shortcut", "siri"]).default("shortcut"),
});

function toMinor(input: number | string) {
  const value =
    typeof input === "number" ? input : Number(String(input).replace(/[^0-9.]/g, ""));
  return Math.round(value * 100);
}

export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return Response.json({ error: "Missing bearer token." }, { status: 401 });
  }

  const [auth] = await db
    .select({ id: apiTokens.id, userId: apiTokens.userId })
    .from(apiTokens)
    .where(and(eq(apiTokens.tokenHash, hashToken(token)), isNull(apiTokens.revokedAt)))
    .limit(1);

  if (!auth) {
    return Response.json({ error: "Invalid or revoked token." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Expected amount and category.", detail: parsed.error.issues },
      { status: 400 },
    );
  }

  const amountMinor = toMinor(parsed.data.amount);
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    return Response.json({ error: "Amount must be greater than zero." }, { status: 400 });
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

    return Response.json(
      {
        error: `No category named "${parsed.data.category}".`,
        available: available.map((c) => c.name),
      },
      { status: 400 },
    );
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

  revalidatePath("/");

  return Response.json({
    ok: true,
    amountMinor,
    category: category.name,
  });
}

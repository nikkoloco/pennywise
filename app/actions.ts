"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { SWATCH_COUNT } from "@/db/defaults";
import { categories, expenses, quickTaps } from "@/db/schema";
import { currentUser } from "@/lib/user";

const logSchema = z.object({
  categoryId: z.uuid(),
  amountMinor: z.number().int().positive(),
  note: z.string().trim().max(140).optional(),
});

export async function logExpense(input: z.infer<typeof logSchema>) {
  const { categoryId, amountMinor, note } = logSchema.parse(input);
  const user = await currentUser();

  await db.insert(expenses).values({
    userId: user.id,
    categoryId,
    amountMinor,
    note: note || null,
    spentAt: new Date(),
  });

  revalidatePath("/");
}

export async function deleteExpense(id: string) {
  const user = await currentUser();
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, z.uuid().parse(id)), eq(expenses.userId, user.id)));
  revalidatePath("/");
}

const tileSchema = z.object({
  label: z.string().trim().min(1).max(24),
  emoji: z.string().trim().min(1).max(8),
  /** Either an existing category, or null to create one from this tile. */
  categoryId: z.uuid().nullable(),
  amountMinor: z.number().int().positive().nullable(),
});

export async function createQuickTap(input: z.infer<typeof tileSchema>) {
  const { label, emoji, categoryId, amountMinor } = tileSchema.parse(input);
  const user = await currentUser();

  const resolvedCategoryId = categoryId ?? (await createCategory(user.id, label, emoji));

  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${quickTaps.sortOrder}), -1) + 1` })
    .from(quickTaps)
    .where(eq(quickTaps.userId, user.id));

  await db.insert(quickTaps).values({
    userId: user.id,
    categoryId: resolvedCategoryId,
    label,
    emoji,
    amountMinor,
    sortOrder: next,
  });

  revalidatePath("/");
}

export async function deleteQuickTap(id: string) {
  const user = await currentUser();
  await db
    .delete(quickTaps)
    .where(and(eq(quickTaps.id, z.uuid().parse(id)), eq(quickTaps.userId, user.id)));
  revalidatePath("/");
}

/** Swatch ramp is fixed, so a new category picks the next colour in rotation. */
async function createCategory(userId: string, name: string, emoji: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categories)
    .where(eq(categories.userId, userId));

  const [created] = await db
    .insert(categories)
    .values({
      userId,
      name,
      emoji,
      color: `swatch-${(count % SWATCH_COUNT) + 1}`,
      sortOrder: count,
    })
    .returning({ id: categories.id });

  return created.id;
}

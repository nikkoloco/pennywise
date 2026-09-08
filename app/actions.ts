"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { SWATCH_COUNT } from "@/db/defaults";
import { apiTokens, categories, events, expenses, quickTaps } from "@/db/schema";
import { EVENT_COLORS } from "@/lib/events";
import { generateToken, hashToken } from "@/lib/tokens";
import { currentUser } from "@/lib/user";

const logSchema = z.object({
  categoryId: z.uuid(),
  amountMinor: z.number().int().positive(),
  note: z.string().trim().max(140).optional(),
  /** Optional roll-up against a planned event, e.g. a trip. */
  eventId: z.uuid().nullable().optional(),
});

export async function logExpense(input: z.infer<typeof logSchema>) {
  const { categoryId, amountMinor, note, eventId } = logSchema.parse(input);
  const user = await currentUser();

  await db.insert(expenses).values({
    userId: user.id,
    categoryId,
    amountMinor,
    note: note || null,
    eventId: eventId ?? null,
    spentAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath("/events");
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

/**
 * Creates a Shortcut token. The plaintext is returned exactly once here and
 * never stored, so losing it means issuing a new one.
 */
export async function createApiToken(name: string) {
  const label = z.string().trim().min(1).max(40).parse(name);
  const user = await currentUser();
  const token = generateToken();

  await db.insert(apiTokens).values({
    userId: user.id,
    name: label,
    tokenHash: hashToken(token),
  });

  revalidatePath("/settings/shortcuts");
  return token;
}

export async function revokeApiToken(id: string) {
  const user = await currentUser();
  await db
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiTokens.id, z.uuid().parse(id)), eq(apiTokens.userId, user.id)));
  revalidatePath("/settings/shortcuts");
}

const eventSchema = z.object({
  name: z.string().trim().min(1).max(40),
  emoji: z.string().trim().min(1).max(8),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  budgetMinor: z.number().int().positive(),
  isRecurringAnnual: z.boolean(),
});

export async function createEvent(input: z.infer<typeof eventSchema>) {
  const data = eventSchema.parse(input);
  const user = await currentUser();

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events)
    .where(eq(events.userId, user.id));

  await db.insert(events).values({
    ...data,
    userId: user.id,
    color: EVENT_COLORS[count % EVENT_COLORS.length],
  });

  revalidatePath("/events");
  revalidatePath("/");
}

export async function deleteEvent(id: string) {
  const user = await currentUser();
  await db
    .delete(events)
    .where(and(eq(events.id, z.uuid().parse(id)), eq(events.userId, user.id)));
  revalidatePath("/events");
  revalidatePath("/");
}

/** Escapes a CSV cell: quote it, and double any quotes inside. */
function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Your data, in a form nothing else owns. Returned as a string so the browser
 * saves it directly rather than exposing a public download URL.
 */
export async function exportData(format: "csv" | "json") {
  const user = await currentUser();

  const rows = await db
    .select({
      spentAt: expenses.spentAt,
      amountMinor: expenses.amountMinor,
      note: expenses.note,
      source: expenses.source,
      category: categories.name,
      event: events.name,
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .leftJoin(events, eq(expenses.eventId, events.id))
    .where(eq(expenses.userId, user.id))
    .orderBy(desc(expenses.spentAt));

  const shaped = rows.map((r) => ({
    date: r.spentAt.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }),
    time: r.spentAt.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" }),
    category: r.category,
    amount: (r.amountMinor / 100).toFixed(2),
    note: r.note ?? "",
    event: r.event ?? "",
    source: r.source,
  }));

  if (format === "json") return JSON.stringify(shaped, null, 2);

  const header = ["date", "time", "category", "amount", "note", "event", "source"];
  return [
    header.join(","),
    ...shaped.map((r) => header.map((k) => csvCell(r[k as keyof typeof r])).join(",")),
  ].join("\n");
}

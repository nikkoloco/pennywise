"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { SWATCH_COUNT } from "@/db/defaults";
import {
  apiTokens,
  categories,
  events,
  expenses,
  quickTaps,
  recurring,
  upcoming,
  users,
} from "@/db/schema";
import { EVENT_COLORS } from "@/lib/events";
import type { PaySchedule } from "@/lib/payPeriod";
import { firstOfMonth } from "@/lib/time";
import { generateToken, hashToken } from "@/lib/tokens";
import { currentUserId } from "@/lib/user";

const logSchema = z.object({
  categoryId: z.uuid(),
  amountMinor: z.number().int().positive(),
  note: z.string().trim().max(140).optional(),
  /** Optional roll-up against a planned event, e.g. a trip. */
  eventId: z.uuid().nullable().optional(),
  /** Set when this settles a recurring payment for the current cutoff. */
  recurringId: z.uuid().nullable().optional(),
});

export async function logExpense(input: z.infer<typeof logSchema>) {
  const { categoryId, amountMinor, note, eventId, recurringId } = logSchema.parse(input);
  const userId = await currentUserId();

  await db.insert(expenses).values({
    userId,
    categoryId,
    amountMinor,
    note: note || null,
    eventId: eventId ?? null,
    recurringId: recurringId ?? null,
    spentAt: new Date(),
  });
  if (eventId) await settleIfPaid(userId, eventId);

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/recurring");
}

/**
 * A one-off plan whose budget has all been spent is done, so it leaves the
 * list on its own. Archived rather than deleted: the spend stays attributed.
 * An annual plan is left alone, since it comes round again next year.
 */
async function settleIfPaid(userId: string, eventId: string) {
  const [plan] = await db
    .select({ budgetMinor: events.budgetMinor, isRecurringAnnual: events.isRecurringAnnual })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, userId)));
  if (!plan || plan.isRecurringAnnual) return;

  const [{ spent }] = await db
    .select({ spent: sql<number>`coalesce(sum(${expenses.amountMinor}), 0)::int` })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), eq(expenses.eventId, eventId)));
  if (spent < plan.budgetMinor) return;

  await db.update(events).set({ isArchived: true }).where(eq(events.id, eventId));
}

export async function deleteExpense(id: string) {
  const userId = await currentUserId();
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, z.uuid().parse(id)), eq(expenses.userId, userId)));
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
  const userId = await currentUserId();

  const resolvedCategoryId = categoryId ?? (await createCategory(userId, label, emoji));

  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${quickTaps.sortOrder}), -1) + 1` })
    .from(quickTaps)
    .where(eq(quickTaps.userId, userId));

  await db.insert(quickTaps).values({
    userId,
    categoryId: resolvedCategoryId,
    label,
    emoji,
    amountMinor,
    sortOrder: next,
  });

  revalidatePath("/");
}

export async function deleteQuickTap(id: string) {
  const userId = await currentUserId();
  await db
    .delete(quickTaps)
    .where(and(eq(quickTaps.id, z.uuid().parse(id)), eq(quickTaps.userId, userId)));
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
  const userId = await currentUserId();
  const token = generateToken();

  await db.insert(apiTokens).values({
    userId,
    name: label,
    tokenHash: hashToken(token),
  });

  revalidatePath("/settings/shortcuts");
  return token;
}

export async function revokeApiToken(id: string) {
  const userId = await currentUserId();
  await db
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiTokens.id, z.uuid().parse(id)), eq(apiTokens.userId, userId)));
  revalidatePath("/settings/shortcuts");
}

/** A cutoff is counted within its month; a weekly pay schedule offers four. */
const cutoffSchema = z.number().int().min(1).max(4);

const eventSchema = z.object({
  name: z.string().trim().min(1).max(40),
  emoji: z.string().trim().min(1).max(8),
  /** The month it has to be paid, as "YYYY-MM". Days are deliberately absent. */
  eventMonth: z.string().regex(/^\d{4}-\d{2}$/),
  budgetMinor: z.number().int().positive(),
  isRecurringAnnual: z.boolean(),
  /** Which of the month's cutoffs pays for it; weekly pay has up to four. */
  cutoff: cutoffSchema,
});

export async function createEvent(input: z.infer<typeof eventSchema>) {
  const data = eventSchema.parse(input);
  const userId = await currentUserId();

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events)
    .where(eq(events.userId, userId));

  await db.insert(events).values({
    ...data,
    eventMonth: firstOfMonth(data.eventMonth),
    userId,
    color: EVENT_COLORS[count % EVENT_COLORS.length],
  });

  revalidatePath("/events");
  revalidatePath("/");
}

export async function deleteEvent(id: string) {
  const userId = await currentUserId();
  await db
    .delete(events)
    .where(and(eq(events.id, z.uuid().parse(id)), eq(events.userId, userId)));
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
  const userId = await currentUserId();

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
    .where(eq(expenses.userId, userId))
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

const upcomingSchema = z.object({
  name: z.string().trim().min(1).max(40),
  emoji: z.string().trim().min(1).max(8),
  approxMinor: z.number().int().positive(),
  cutoff: cutoffSchema,
});

/**
 * A rough thing coming up. The amount is a guess and is never added to a
 * total, so nothing downstream has to trust it.
 */
export async function createUpcoming(input: z.infer<typeof upcomingSchema>) {
  const data = upcomingSchema.parse(input);
  const userId = await currentUserId();

  await db.insert(upcoming).values({ ...data, userId });
  revalidatePath("/");
}

export async function deleteUpcoming(id: string) {
  const userId = await currentUserId();
  await db
    .delete(upcoming)
    .where(and(eq(upcoming.id, z.uuid().parse(id)), eq(upcoming.userId, userId)));
  revalidatePath("/");
}

const subcategorySchema = z.object({
  parentId: z.uuid(),
  name: z.string().trim().min(1).max(30),
});

/**
 * Adds a subgroup to an existing category. It inherits the parent's emoji and
 * colour, so a rolled-up chart still shows one colour per group and there is
 * nothing to choose beyond the name.
 */
export async function createSubcategory(input: z.infer<typeof subcategorySchema>) {
  const { parentId, name } = subcategorySchema.parse(input);
  const userId = await currentUserId();

  const [parent] = await db
    .select({ emoji: categories.emoji, color: categories.color })
    .from(categories)
    .where(and(eq(categories.id, parentId), eq(categories.userId, userId)));

  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${categories.sortOrder}), 0) + 1` })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.parentId, parentId)));

  const [created] = await db
    .insert(categories)
    .values({
      userId,
      parentId,
      name,
      emoji: parent.emoji,
      color: parent.color,
      sortOrder: next,
    })
    .returning({ id: categories.id });

  revalidatePath("/");
  return created.id;
}

const recurringSchema = z.object({
  name: z.string().trim().min(1).max(40),
  emoji: z.string().trim().min(1).max(8),
  categoryId: z.uuid(),
  amountMinor: z.number().int().positive(),
  /** How many `unit`s between payments: 1 month is monthly, 1 week weekly. */
  every: z.number().int().min(1).max(60),
  unit: z.enum(["week", "month"]),
  /** Null runs forever, which is what a subscription usually does. */
  runsForMonths: z.number().int().min(1).max(600).nullable(),
  /** Null lands in every cutoff, which is what twice a month and weekly do. */
  cutoff: cutoffSchema.nullable(),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/),
  /** The day it is taken when that is fixed, null when it varies. */
  payOnDay: z.number().int().min(1).max(31).nullable(),
});

export async function createRecurring(input: z.infer<typeof recurringSchema>) {
  const data = recurringSchema.parse(input);
  const userId = await currentUserId();

  await db.insert(recurring).values({
    ...data,
    startMonth: firstOfMonth(data.startMonth),
    userId,
  });

  revalidatePath("/recurring");
}

export async function deleteRecurring(id: string) {
  const userId = await currentUserId();
  await db
    .delete(recurring)
    .where(and(eq(recurring.id, z.uuid().parse(id)), eq(recurring.userId, userId)));
  revalidatePath("/recurring");
}

/**
 * Removes a token outright, rather than leaving a revoked row behind. Revoking
 * keeps the trail of something that once had access; deleting is for tokens
 * you would rather forget existed, such as a botched first attempt.
 */
export async function deleteApiToken(id: string) {
  const userId = await currentUserId();
  await db
    .delete(apiTokens)
    .where(and(eq(apiTokens.id, z.uuid().parse(id)), eq(apiTokens.userId, userId)));
  revalidatePath("/settings/shortcuts");
}

/**
 * Editing, entity by entity.
 *
 * Every one of these is the create schema with an id attached, so a form can
 * submit the same shape whether it is making something or correcting it. Each
 * scopes its where clause by user, so an id from elsewhere matches nothing.
 */
const withId = <T extends z.ZodRawShape>(shape: z.ZodObject<T>) =>
  shape.extend({ id: z.uuid() });

export async function updateExpense(input: z.infer<ReturnType<typeof withId<typeof logSchema.shape>>>) {
  const { id, categoryId, amountMinor, note, eventId } = withId(logSchema).parse(input);
  const userId = await currentUserId();

  await db
    .update(expenses)
    .set({
      categoryId,
      amountMinor,
      note: note || null,
      eventId: eventId ?? null,
    })
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
  if (eventId) await settleIfPaid(userId, eventId);

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/calendar");
  revalidatePath("/insights");
}

export async function updateEvent(input: z.infer<ReturnType<typeof withId<typeof eventSchema.shape>>>) {
  const { id, ...data } = withId(eventSchema).parse(input);
  const userId = await currentUserId();

  await db
    .update(events)
    .set({ ...data, eventMonth: firstOfMonth(data.eventMonth) })
    .where(and(eq(events.id, id), eq(events.userId, userId)));

  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function updateUpcoming(input: z.infer<ReturnType<typeof withId<typeof upcomingSchema.shape>>>) {
  const { id, ...data } = withId(upcomingSchema).parse(input);
  const userId = await currentUserId();

  await db
    .update(upcoming)
    .set(data)
    .where(and(eq(upcoming.id, id), eq(upcoming.userId, userId)));

  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function updateRecurring(input: z.infer<ReturnType<typeof withId<typeof recurringSchema.shape>>>) {
  const { id, ...data } = withId(recurringSchema).parse(input);
  const userId = await currentUserId();

  await db
    .update(recurring)
    .set({ ...data, startMonth: firstOfMonth(data.startMonth) })
    .where(and(eq(recurring.id, id), eq(recurring.userId, userId)));

  revalidatePath("/recurring");
  revalidatePath("/calendar");
}

export async function updateQuickTap(input: z.infer<ReturnType<typeof withId<typeof tileSchema.shape>>>) {
  const { id, label, emoji, categoryId, amountMinor } = withId(tileSchema).parse(input);
  const userId = await currentUserId();

  await db
    .update(quickTaps)
    .set({ label, emoji, amountMinor, ...(categoryId ? { categoryId } : {}) })
    .where(and(eq(quickTaps.id, id), eq(quickTaps.userId, userId)));

  revalidatePath("/");
}

const categoryEditSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(30),
  emoji: z.string().trim().min(1).max(8),
  color: z.string().trim().min(1).max(20),
});

/**
 * Renaming a category rewrites history: every expense already filed under it
 * reads the new name, which is the point. Subgroups keep their own name but
 * follow the parent's colour, so the swatch is pushed down to them here.
 */
export async function updateCategory(input: z.infer<typeof categoryEditSchema>) {
  const { id, name, emoji, color } = categoryEditSchema.parse(input);
  const userId = await currentUserId();

  await db
    .update(categories)
    .set({ name, emoji, color })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  await db
    .update(categories)
    .set({ color })
    .where(and(eq(categories.parentId, id), eq(categories.userId, userId)));

  revalidatePath("/");
  revalidatePath("/insights");
  revalidatePath("/settings");
}

export async function deleteCategory(id: string) {
  const userId = await currentUserId();
  await db
    .delete(categories)
    .where(and(eq(categories.id, z.uuid().parse(id)), eq(categories.userId, userId)));
  revalidatePath("/");
  revalidatePath("/settings");
}

const dayOfMonth = z.number().int().min(1).max(31);

/** Paydays as the cadence needs them: one day, two ascending days, or a weekday. */
const payScheduleSchema = z.discriminatedUnion("cadence", [
  z.object({ cadence: z.literal("monthly"), paydays: z.tuple([dayOfMonth]) }),
  z.object({
    cadence: z.literal("twice_a_month"),
    paydays: z.tuple([dayOfMonth, dayOfMonth]).refine(([first, second]) => first < second),
  }),
  z.object({ cadence: z.literal("weekly"), paydays: z.tuple([z.number().int().min(1).max(7)]) }),
]);

export type PayScheduleResult = { ok: true } | { ok: false; message: string };

/**
 * When pay lands. Every screen names its cutoffs from this, so the whole app
 * is revalidated rather than the few paths that happen to show one today.
 */
export async function setPaySchedule(input: PaySchedule): Promise<PayScheduleResult> {
  const userId = await currentUserId();

  const parsed = payScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Enter the days pay lands on, earlier one first." };
  }

  await db
    .update(users)
    .set({ payCadence: parsed.data.cadence, paydays: parsed.data.paydays })
    .where(eq(users.id, userId));

  revalidatePath("/", "layout");
  return { ok: true };
}

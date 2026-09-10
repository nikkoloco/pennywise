import { and, asc, count, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./index";
import {
  apiTokens,
  categories,
  events,
  expenses,
  quickTaps,
  recurring,
  upcoming,
} from "./schema";

type Range = { start: Date; end: Date };

/** Every category, parents and subgroups alike. Callers decide how to nest. */
export async function getCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.isArchived, false)))
    .orderBy(asc(categories.sortOrder));
}

export async function getQuickTaps(userId: string) {
  return db
    .select({
      id: quickTaps.id,
      label: quickTaps.label,
      emoji: quickTaps.emoji,
      amountMinor: quickTaps.amountMinor,
      categoryId: quickTaps.categoryId,
    })
    .from(quickTaps)
    .where(eq(quickTaps.userId, userId))
    .orderBy(asc(quickTaps.sortOrder));
}

/**
 * Expenses carry both the exact category and the group it rolls up to. Lists
 * want the specific one ("Groceries"), charts want the group ("Food"), and
 * resolving it here means neither has to know the hierarchy exists.
 */
export async function getExpensesIn(userId: string, range: Range) {
  const parent = alias(categories, "parent_category");

  return db
    .select({
      id: expenses.id,
      amountMinor: expenses.amountMinor,
      note: expenses.note,
      spentAt: expenses.spentAt,
      source: expenses.source,
      /** Carried so an entry can be opened for correction, not just displayed. */
      categoryId: expenses.categoryId,
      eventId: expenses.eventId,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
      categoryColor: categories.color,
      groupName: sql<string>`coalesce(${parent.name}, ${categories.name})`,
      groupEmoji: sql<string>`coalesce(${parent.emoji}, ${categories.emoji})`,
      groupColor: sql<string>`coalesce(${parent.color}, ${categories.color})`,
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .leftJoin(parent, eq(categories.parentId, parent.id))
    .where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.spentAt, range.start),
        lte(expenses.spentAt, range.end),
      ),
    )
    .orderBy(desc(expenses.spentAt));
}

export async function getTotalIn(userId: string, range: Range) {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amountMinor}), 0)::int` })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.spentAt, range.start),
        lte(expenses.spentAt, range.end),
      ),
    );
  return row.total;
}

export async function getEvents(userId: string) {
  return db
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.isArchived, false)))
    .orderBy(asc(events.eventMonth));
}

export async function getApiTokens(userId: string) {
  return db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      createdAt: apiTokens.createdAt,
      lastUsedAt: apiTokens.lastUsedAt,
      revokedAt: apiTokens.revokedAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, userId))
    .orderBy(desc(apiTokens.createdAt));
}

/**
 * Every expense attributed to an event. Cycle filtering happens in code, since
 * an annual event's window depends on its own next occurrence.
 */
export async function getEventSpend(userId: string) {
  return db
    .select({
      eventId: expenses.eventId,
      amountMinor: expenses.amountMinor,
      spentAt: expenses.spentAt,
    })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), isNotNull(expenses.eventId)));
}

/** Rough upcoming costs, in the order they were thought of. */
export async function getUpcoming(userId: string) {
  return db
    .select({
      id: upcoming.id,
      name: upcoming.name,
      emoji: upcoming.emoji,
      approxMinor: upcoming.approxMinor,
      cutoff: upcoming.cutoff,
    })
    .from(upcoming)
    .where(eq(upcoming.userId, userId))
    .orderBy(asc(upcoming.createdAt));
}

export async function getRecurring(userId: string) {
  return db
    .select({
      id: recurring.id,
      name: recurring.name,
      emoji: recurring.emoji,
      categoryId: recurring.categoryId,
      amountMinor: recurring.amountMinor,
      every: recurring.every,
      unit: recurring.unit,
      runsForMonths: recurring.runsForMonths,
      cutoff: recurring.cutoff,
      startMonth: recurring.startMonth,
      payOnDay: recurring.payOnDay,
    })
    .from(recurring)
    .where(and(eq(recurring.userId, userId), eq(recurring.isArchived, false)))
    .orderBy(asc(recurring.createdAt));
}

/**
 * How many times each recurring payment was actually settled inside a window.
 * Being due is derived from the schedule; being paid can only come from a
 * logged expense. A count rather than a flag, because a weekly payment is owed
 * more than once inside one pay period.
 */
export async function getRecurringPaid(userId: string, range: Range) {
  const rows = await db
    .select({ recurringId: expenses.recurringId, paid: count() })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        isNotNull(expenses.recurringId),
        gte(expenses.spentAt, range.start),
        lte(expenses.spentAt, range.end),
      ),
    )
    .groupBy(expenses.recurringId);

  return new Map(rows.map((r) => [r.recurringId as string, r.paid]));
}

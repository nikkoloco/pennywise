import { and, asc, desc, eq, gte, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "./index";
import {
  apiAttempts,
  apiTokens,
  categories,
  events,
  expenses,
  quickTaps,
  upcoming,
} from "./schema";

type Range = { start: Date; end: Date };

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

export async function getExpensesIn(userId: string, range: Range) {
  return db
    .select({
      id: expenses.id,
      amountMinor: expenses.amountMinor,
      note: expenses.note,
      spentAt: expenses.spentAt,
      source: expenses.source,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
      categoryColor: categories.color,
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
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

/** The diagnostic trail for the Shortcuts endpoint, newest first. */
export async function getApiAttempts(userId: string, limit = 8) {
  return db
    .select({
      id: apiAttempts.id,
      at: apiAttempts.at,
      status: apiAttempts.status,
      message: apiAttempts.message,
    })
    .from(apiAttempts)
    .where(or(eq(apiAttempts.userId, userId), isNull(apiAttempts.userId)))
    .orderBy(desc(apiAttempts.at))
    .limit(limit);
}

/** Rough upcoming costs, in the order they were thought of. */
export async function getUpcoming(userId: string) {
  return db
    .select({
      id: upcoming.id,
      name: upcoming.name,
      emoji: upcoming.emoji,
      approxMinor: upcoming.approxMinor,
    })
    .from(upcoming)
    .where(eq(upcoming.userId, userId))
    .orderBy(asc(upcoming.createdAt));
}

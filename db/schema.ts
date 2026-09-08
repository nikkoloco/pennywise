import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Pennywise schema.
 *
 * Two rules hold throughout:
 *  - Money is stored as integer minor units (centavos). Never floats, never
 *    formatted strings. Formatting happens at the render edge only.
 *  - There is no balance or account concept anywhere. The app logs what leaves,
 *    never what remains. That omission is the product.
 */

/** Where an expense came from. Lets the app show what Siri and Shortcuts logged. */
export const expenseSource = pgEnum("expense_source", ["app", "shortcut", "siri"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  currency: text("currency").notNull().default("PHP"),
  timezone: text("timezone").notNull().default("Asia/Manila"),
  /** ISO weekday the week starts on: 1 = Monday. */
  weekStartsOn: integer("week_starts_on").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    /** Swatch token name from the fixed palette ramp, e.g. "swatch-6". */
    color: text("color").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isArchived: boolean("is_archived").notNull().default(false),
  },
  (t) => [uniqueIndex("categories_user_name_idx").on(t.userId, t.name)],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    color: text("color").notNull(),
    /** Calendar day of the event in the user's timezone. */
    eventDate: date("event_date").notNull(),
    /** Planned target, not money set aside. Spend is compared against it. */
    budgetMinor: integer("budget_minor").notNull(),
    notes: text("notes"),
    /** Birthdays and holidays roll forward a year once they pass. */
    isRecurringAnnual: boolean("is_recurring_annual").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_user_date_idx").on(t.userId, t.eventDate)],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    /** Optional roll-up against a planned event, e.g. a trip. */
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    amountMinor: integer("amount_minor").notNull(),
    note: text("note"),
    spentAt: timestamp("spent_at", { withTimezone: true }).notNull(),
    source: expenseSource("source").notNull().default("app"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("expenses_user_spent_at_idx").on(t.userId, t.spentAt.desc()),
    index("expenses_user_category_idx").on(t.userId, t.categoryId),
    index("expenses_user_event_idx").on(t.userId, t.eventId),
  ],
);

/**
 * The one-tap tiles on the home grid. User-editable data, not hardcoded UI, so
 * adding "Milk Tea" never requires a code change.
 */
export const quickTaps = pgTable(
  "quick_taps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    emoji: text("emoji").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    /** Null opens the keypad prefilled to the category; set logs on a single tap. */
    amountMinor: integer("amount_minor"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("quick_taps_user_sort_idx").on(t.userId, t.sortOrder)],
);

/** Bearer tokens for Apple Shortcuts. Stored hashed; shown once at creation. */
export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("api_tokens_user_idx").on(t.userId)],
);

/** Optional monthly per-category caps. `month` is always the first of the month. */
export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    month: date("month").notNull(),
    limitMinor: integer("limit_minor").notNull(),
  },
  (t) => [uniqueIndex("budgets_user_category_month_idx").on(t.userId, t.categoryId, t.month)],
);

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Event = typeof events.$inferSelect;
export type QuickTap = typeof quickTaps.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
export type Budget = typeof budgets.$inferSelect;

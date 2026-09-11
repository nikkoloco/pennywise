import {
  type AnyPgColumn,
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

/** The unit a recurring payment's interval is counted in. */
export const recurringUnit = pgEnum("recurring_unit", ["week", "month"]);

/** How often salary lands, which is what a cutoff is the stretch between. */
export const payCadence = pgEnum("pay_cadence", ["monthly", "twice_a_month", "weekly"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  /**
   * Null only on the first account, made by the seed script before logins
   * existed, until its owner claims it in Settings. Every account created
   * through sign-up has one from the start.
   */
  passwordHash: text("password_hash"),
  /** Sign-in lockout, kept in the row so it survives any serverless instance. */
  passwordFailedAttempts: integer("password_failed_attempts").notNull().default(0),
  passwordLockedUntil: timestamp("password_locked_until", { withTimezone: true }),
  /** Null until a PIN is chosen. Optional: it locks a signed-in phone, nothing more. */
  pinHash: text("pin_hash"),
  /** Brute-force state lives in the row, so a lockout survives any instance. */
  pinFailedAttempts: integer("pin_failed_attempts").notNull().default(0),
  pinLockedUntil: timestamp("pin_locked_until", { withTimezone: true }),
  currency: text("currency").notNull().default("PHP"),
  timezone: text("timezone").notNull().default("Asia/Manila"),
  /** ISO weekday the week starts on: 1 = Monday. */
  weekStartsOn: integer("week_starts_on").notNull().default(1),
  payCadence: payCadence("pay_cadence").notNull().default("twice_a_month"),
  /**
   * When pay lands: one or two days of the month, ascending, or for a weekly
   * cadence a single ISO weekday. A day the month is too short for falls on
   * its last day instead.
   */
  paydays: integer("paydays").array().notNull().default([10, 25]),
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
    /**
     * Set when this is a subcategory, e.g. Groceries under Food. Exactly one
     * level deep: a category with a parent never has children of its own, so
     * rolling spend up is a single hop and charts never need recursion.
     */
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "cascade",
    }),
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
    /** The month the plan is due, always stored as the first of that month. */
    eventMonth: date("event_month").notNull(),
    /** Which pay period inside that month it comes out of: 1 or 2. */
    cutoff: integer("cutoff").notNull().default(1),
    /** Planned target, not money set aside. Spend is compared against it. */
    budgetMinor: integer("budget_minor").notNull(),
    notes: text("notes"),
    /** Birthdays and holidays roll forward a year once they pass. */
    isRecurringAnnual: boolean("is_recurring_annual").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_user_month_idx").on(t.userId, t.eventMonth)],
);

/**
 * A payment that comes back: a subscription, an installment, an annual fee.
 *
 * Three fields describe the schedule. `every` and `unit` are how often it
 * lands, so 1 month is monthly and 1 week weekly, and `runsForMonths` is how
 * long that goes on for, counted in months from the start rather than in
 * payments, so "every 3 months for a year" is four payments and reads the way
 * it is said.
 *
 * Nothing here is ever logged automatically. A due payment is an invitation to
 * tap, because the app's one rule is that it records money that actually left,
 * and a cancelled subscription must not keep charging you in the totals.
 */
export const recurring = pgTable(
  "recurring",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    amountMinor: integer("amount_minor").notNull(),
    /** How many `unit`s between payments. 1 month is monthly, 12 annual. */
    every: integer("every").notNull().default(1),
    unit: recurringUnit("unit").notNull().default("month"),
    /** Months from the start before it stops. Null runs forever. */
    runsForMonths: integer("runs_for_months"),
    /**
     * Which pay period it comes out of: 1 ends on the 10th, 2 on the 25th.
     * Null lands in both, which is how twice a month and weekly are stored.
     */
    cutoff: integer("cutoff"),
    /** Where the schedule counts from, always the first of that month. */
    startMonth: date("start_month").notNull(),
    /** The day of the month it is taken, when that is fixed. Null when it varies. */
    payOnDay: integer("pay_on_day"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("recurring_user_idx").on(t.userId)],
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
    /** Set when this expense settled a recurring payment for its cutoff. */
    recurringId: uuid("recurring_id").references(() => recurring.id, {
      onDelete: "set null",
    }),
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

/**
 * Rough things coming up, with a guess at what they might cost.
 *
 * Deliberately not an event: a plan has a month and a budget firm enough to
 * count towards a total, while these are a note with a number attached. They
 * never reach any total, which is exactly why they are allowed to be wrong,
 * and they carry no date because the point is to remember the thing at all.
 */
export const upcoming = pgTable(
  "upcoming",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    /** A guess, never summed into a total. */
    approxMinor: integer("approx_minor").notNull(),
    /** Which half of the month's pay should absorb it. No month: these have no date. */
    cutoff: integer("cutoff").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("upcoming_user_created_idx").on(t.userId, t.createdAt)],
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
export type Upcoming = typeof upcoming.$inferSelect;
export type Recurring = typeof recurring.$inferSelect;

/**
 * A short diagnostic trail for the Shortcuts endpoint. A Shortcut that fails
 * from the Lock Screen shows nothing on the phone, so the reason has to be
 * visible somewhere; this is that somewhere. Trimmed to the most recent rows.
 */
export const apiAttempts = pgTable("api_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Null when the request never got as far as identifying anyone. */
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  status: integer("status").notNull(),
  message: text("message").notNull(),
});

export type ApiAttempt = typeof apiAttempts.$inferSelect;

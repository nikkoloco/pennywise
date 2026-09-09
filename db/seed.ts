import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { DEFAULT_CATEGORIES } from "./defaults";
import { categories, quickTaps, users } from "./schema";

/**
 * Creates the single user, then adds any default category and tile they are
 * missing. Safe to re-run, and re-running is how a newly added default reaches
 * an account that was seeded before it existed.
 */
async function seed() {
  const [existing] = await db.select({ id: users.id }).from(users).limit(1);
  const user =
    existing ??
    (await db
      .insert(users)
      .values({ email: process.env.SEED_EMAIL ?? "owner@pennywise.local" })
      .returning({ id: users.id }))[0];

  const present = new Set(
    (
      await db
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.userId, user.id))
    ).map((c) => c.name),
  );

  const missing = DEFAULT_CATEGORIES.filter((c) => !present.has(c.name));
  if (missing.length === 0) {
    console.log("every default category is already present");
    return;
  }

  const [{ nextSort }] = await db
    .select({ nextSort: sql<number>`coalesce(max(${categories.sortOrder}), -1) + 1` })
    .from(categories)
    .where(eq(categories.userId, user.id));

  const inserted = await db
    .insert(categories)
    .values(missing.map((c, i) => ({ ...c, userId: user.id, sortOrder: nextSort + i })))
    .returning();

  const [{ nextTile }] = await db
    .select({ nextTile: sql<number>`coalesce(max(${quickTaps.sortOrder}), -1) + 1` })
    .from(quickTaps)
    .where(eq(quickTaps.userId, user.id));

  await db.insert(quickTaps).values(
    inserted.map((c, i) => ({
      userId: user.id,
      categoryId: c.id,
      label: c.name,
      emoji: c.emoji,
      amountMinor: null,
      sortOrder: nextTile + i,
    })),
  );

  console.log(`added ${inserted.length}: ${inserted.map((c) => c.name).join(", ")}`);
}

seed();

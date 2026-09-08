import "dotenv/config";
import { db } from "./index";
import { DEFAULT_CATEGORIES } from "./defaults";
import { categories, quickTaps, users } from "./schema";

/**
 * Creates the single user and their starting categories and tiles.
 * Safe to re-run: it does nothing once a user exists.
 */
async function seed() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    console.log("user already present, nothing to seed");
    return;
  }

  const [user] = await db
    .insert(users)
    .values({ email: process.env.SEED_EMAIL ?? "owner@pennywise.local" })
    .returning();

  const inserted = await db
    .insert(categories)
    .values(
      DEFAULT_CATEGORIES.map((c, i) => ({ ...c, userId: user.id, sortOrder: i })),
    )
    .returning();

  await db.insert(quickTaps).values(
    inserted.map((c, i) => ({
      userId: user.id,
      categoryId: c.id,
      label: c.name,
      emoji: c.emoji,
      amountMinor: null,
      sortOrder: i,
    })),
  );

  console.log(`seeded user with ${inserted.length} categories and tiles`);
}

seed();

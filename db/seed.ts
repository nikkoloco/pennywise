import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { DEFAULT_CATEGORIES } from "./defaults";
import { categories, quickTaps, users } from "./schema";

/**
 * Creates the single user, then adds any default category, subgroup and tile
 * they are missing. Safe to re-run, and re-running is how a newly added default
 * reaches an account that was seeded before it existed.
 */
async function seed() {
  const [existing] = await db.select({ id: users.id }).from(users).limit(1);
  const user =
    existing ??
    (
      await db
        .insert(users)
        .values({ email: process.env.SEED_EMAIL ?? "owner@pennywise.local" })
        .returning({ id: users.id })
    )[0];

  const present = new Map(
    (
      await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.userId, user.id))
    ).map((c) => [c.name, c.id]),
  );

  const added: string[] = [];

  for (const [index, parent] of DEFAULT_CATEGORIES.entries()) {
    let parentId = present.get(parent.name);

    if (!parentId) {
      const [created] = await db
        .insert(categories)
        .values({
          userId: user.id,
          name: parent.name,
          emoji: parent.emoji,
          color: parent.color,
          sortOrder: index,
        })
        .returning({ id: categories.id });
      parentId = created.id;
      present.set(parent.name, parentId);
      added.push(parent.name);

      if (parent.tile !== false) await addTile(user.id, parentId, parent);
    }

    // Subgroups take the parent's colour and emoji, and never get a tile.
    for (const [order, child] of parent.children.entries()) {
      if (present.has(child)) continue;
      const [created] = await db
        .insert(categories)
        .values({
          userId: user.id,
          name: child,
          emoji: parent.emoji,
          color: parent.color,
          sortOrder: order + 1,
          parentId,
        })
        .returning({ id: categories.id });
      present.set(child, created.id);
      added.push(`${parent.name}/${child}`);
    }
  }

  console.log(added.length === 0 ? "everything is already present" : `added: ${added.join(", ")}`);
}

async function addTile(
  userId: string,
  categoryId: string,
  category: { name: string; emoji: string },
) {
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${quickTaps.sortOrder}), -1) + 1` })
    .from(quickTaps)
    .where(eq(quickTaps.userId, userId));

  await db.insert(quickTaps).values({
    userId,
    categoryId,
    label: category.name,
    emoji: category.emoji,
    amountMinor: null,
    sortOrder: next,
  });
}

seed();

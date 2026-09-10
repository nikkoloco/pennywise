import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { DEFAULT_CATEGORIES } from "./defaults";
import { categories, quickTaps } from "./schema";

/**
 * Gives an account the default categories, subgroups and tiles it is missing.
 *
 * Runs on two occasions that want exactly the same thing: a friend signing up,
 * who is missing all of them, and the seed script re-run after a new default
 * was added, where the account is missing only that one. It compares by name
 * and adds what is absent, so it is safe to call as often as you like and
 * never disturbs a category the owner has since renamed or archived.
 *
 * Returns what it added, for the seed script to report.
 */
export async function provisionUser(userId: string) {
  const present = new Map(
    (
      await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.userId, userId))
    ).map((c) => [c.name, c.id]),
  );

  const added: string[] = [];

  for (const [index, parent] of DEFAULT_CATEGORIES.entries()) {
    let parentId = present.get(parent.name);

    if (!parentId) {
      const [created] = await db
        .insert(categories)
        .values({
          userId,
          name: parent.name,
          emoji: parent.emoji,
          color: parent.color,
          sortOrder: index,
        })
        .returning({ id: categories.id });
      parentId = created.id;
      present.set(parent.name, parentId);
      added.push(parent.name);

      if (parent.tile !== false) await addTile(userId, parentId, parent);
    }

    // Subgroups take the parent's colour and emoji, and never get a tile.
    for (const [order, child] of parent.children.entries()) {
      if (present.has(child)) continue;
      const [created] = await db
        .insert(categories)
        .values({
          userId,
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

  return added;
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

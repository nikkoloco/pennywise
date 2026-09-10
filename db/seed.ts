import "dotenv/config";
import { db } from "./index";
import { provisionUser } from "./provision";
import { users } from "./schema";

/**
 * Creates the first account if the database is empty, then tops it up with any
 * default category, subgroup or tile it is missing. Safe to re-run, and
 * re-running is how a newly added default reaches an account seeded before it
 * existed. Accounts made through sign-up provision themselves.
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

  const added = await provisionUser(user.id);

  console.log(added.length === 0 ? "everything is already present" : `added: ${added.join(", ")}`);
}

seed();

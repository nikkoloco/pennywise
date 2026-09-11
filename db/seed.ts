import "dotenv/config";
import { db } from "./index";
import { provisionUser } from "./provision";
import { users } from "./schema";

/**
 * Creates the first account if the database is empty, then tops every account
 * up with any default category, subgroup or tile it is missing. Safe to re-run,
 * and re-running is how a newly added default reaches accounts that existed
 * before it did. Accounts made through sign-up provision themselves at sign-up.
 */
async function seed() {
  let accounts = await db.select({ id: users.id, email: users.email }).from(users);
  if (accounts.length === 0) {
    accounts = await db
      .insert(users)
      .values({ email: process.env.SEED_EMAIL ?? "owner@pennywise.local" })
      .returning({ id: users.id, email: users.email });
  }

  for (const account of accounts) {
    const added = await provisionUser(account.id);
    console.log(
      `${account.email}: ${added.length === 0 ? "everything is already present" : `added ${added.join(", ")}`}`,
    );
  }
}

seed();

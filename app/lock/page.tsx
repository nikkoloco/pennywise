import { eq } from "drizzle-orm";
import { Brand } from "@/components/auth/Brand";
import { PinPad } from "@/components/auth/PinPad";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

/**
 * The PIN pad for the account already in the session. Signing out is offered
 * right here because a forgotten PIN would otherwise be the end of the road:
 * the password can always let you back in and Settings can turn the PIN off.
 */
export default async function LockPage() {
  const userId = await currentUserId();
  const [user] = await db
    .select({ pinHash: users.pinHash })
    .from(users)
    .where(eq(users.id, userId));

  return (
    <main className="safe-top safe-bottom flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12">
      <Brand />

      <PinPad needsSetup={!user?.pinHash} />

      <div className="w-full max-w-xs">
        <SignOutButton variant="ghost" />
      </div>
    </main>
  );
}

import { PinPad } from "@/components/auth/PinPad";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function LockPage() {
  const [user] = await db.select({ pinHash: users.pinHash }).from(users).limit(1);

  return (
    <main className="safe-top safe-bottom flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="text-center">
        <p className="text-5xl font-extrabold text-gold-500">₱</p>
        <p className="mt-2 text-sm tracking-[0.2em] text-sky-300 uppercase">
          Pennywise
        </p>
      </div>

      <PinPad needsSetup={!user?.pinHash} />
    </main>
  );
}

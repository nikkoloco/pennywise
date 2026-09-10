import { redirect } from "next/navigation";
import { PinPad } from "@/components/auth/PinPad";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAccount } from "@/db/queries";
import { currentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

/**
 * Choosing a PIN, which only ever happens with the app already open. An
 * account that has one has nothing to do here; changing it means turning the
 * old one off first, which is a deliberate two steps rather than a slip.
 */
export default async function SetPinPage() {
  const account = await getAccount(await currentUserId());
  if (account.hasPin) redirect("/settings");

  return (
    <main className="flex flex-1 flex-col gap-8 pb-6">
      <PageHeader title="Set a PIN" />

      <p className="px-6 text-sm text-sky-300">
        Six digits, asked for when you lock Pennywise. It keeps your spending off
        the screen if someone else picks up your phone.
      </p>

      <div className="flex justify-center px-6">
        <PinPad needsSetup done="/settings" />
      </div>
    </main>
  );
}

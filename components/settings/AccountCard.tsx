"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setCredentials } from "@/app/auth-actions";
import { clearPin } from "@/app/lock-actions";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LockButton } from "@/components/settings/LockButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const FIELD =
  "min-h-11 w-full rounded-2xl bg-ink-600 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none";

/**
 * The account, in one place: what you sign in with, whether a PIN guards the
 * app, and the way out. Saving an email and password here is also how the
 * original account, made before there were logins, gains one without any of
 * its expenses moving.
 */
export function AccountCard({ email: current, hasPin }: { email: string; hasPin: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState(current);
  const [password, setPassword] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setNote(null);

    const result = await setCredentials(email, password);
    if (result.ok) {
      setPassword("");
      setNote("Saved. Sign in with these from now on.");
      router.refresh();
    } else {
      setNote(result.message);
    }

    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <form onSubmit={save} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            inputMode="email"
            required
            className={FIELD}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password, 8 characters or more"
            aria-label="New password"
            autoComplete="new-password"
            required
            className={FIELD}
          />
          <Button type="submit" className="w-full">
            {busy ? "One moment" : "Save sign-in details"}
          </Button>
          <p role="status" aria-live="polite" className="h-4 text-center text-xs text-gold-300">
            {note ?? ""}
          </p>
        </form>
      </Card>

      {hasPin ? (
        <>
          <LockButton />
          <Button
            variant="ghost"
            className="w-full"
            onClick={() =>
              startTransition(async () => {
                await clearPin();
                router.refresh();
              })
            }
          >
            Turn off PIN
          </Button>
        </>
      ) : (
        /* A link, styled as a button rather than wrapping one: nesting the two
           gives a screen reader a control inside a control. */
        <Link
          href="/settings/pin"
          className="flex min-h-11 w-full items-center justify-center rounded-full border border-ink-500 bg-ink-600 px-6 text-base font-bold text-sky-100"
        >
          Set a PIN
        </Link>
      )}

      <SignOutButton />
    </div>
  );
}

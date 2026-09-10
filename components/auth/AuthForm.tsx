"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp } from "@/app/auth-actions";
import { Button } from "@/components/ui/Button";

const FIELD =
  "min-h-11 w-full rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none";

/**
 * Both halves of getting in. They share every field but the invite code, and
 * splitting them into two components would mean keeping two keyboards, two
 * error lines and two busy states in step.
 */
export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === "signup";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    const result = isSignUp
      ? await signUp(email, password, invite)
      : await signIn(email, password);

    if (result.ok) {
      router.replace("/");
      router.refresh();
      return;
    }

    setError(result.message);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email"
        /* Phone keyboards capitalise and autocorrect by default, which turns a
           typed address into one that will not match. */
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
        placeholder={isSignUp ? "Password, 8 characters or more" : "Password"}
        aria-label="Password"
        autoComplete={isSignUp ? "new-password" : "current-password"}
        required
        className={FIELD}
      />

      {isSignUp && (
        <input
          value={invite}
          onChange={(e) => setInvite(e.target.value)}
          placeholder="Invite code"
          aria-label="Invite code"
          autoCapitalize="none"
          autoCorrect="off"
          required
          className={FIELD}
        />
      )}

      <p role="status" aria-live="polite" className="h-5 text-center text-xs text-gold-300">
        {error ?? ""}
      </p>

      <Button type="submit" className="w-full">
        {busy ? "One moment" : isSignUp ? "Create account" : "Sign in"}
      </Button>

      <p className="mt-2 text-center text-xs text-sky-300">
        {isSignUp ? "Already have an account? " : "Got an invite code? "}
        <Link
          href={isSignUp ? "/signin" : "/signup"}
          className="font-semibold text-sky-100 underline"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

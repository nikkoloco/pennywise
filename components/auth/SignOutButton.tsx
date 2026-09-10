"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/app/auth-actions";
import { Button } from "@/components/ui/Button";

/** The way back to sign-in, and the way out of a forgotten PIN. */
export function SignOutButton({
  variant = "secondary",
}: {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <Button
      variant={variant}
      className="w-full"
      onClick={() =>
        startTransition(async () => {
          await signOut();
          router.replace("/signin");
          router.refresh();
        })
      }
    >
      Sign out
    </Button>
  );
}

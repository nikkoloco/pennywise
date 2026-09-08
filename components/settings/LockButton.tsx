"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { lockNow } from "@/app/lock-actions";
import { Button } from "@/components/ui/Button";

export function LockButton() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() =>
        startTransition(async () => {
          await lockNow();
          router.replace("/lock");
        })
      }
    >
      Lock Pennywise
    </Button>
  );
}

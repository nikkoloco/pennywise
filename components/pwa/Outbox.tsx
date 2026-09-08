"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { logExpense } from "@/app/actions";
import { formatMinor } from "@/lib/money";
import { readOutbox, writeOutbox, type PendingExpense } from "@/lib/outbox";

/**
 * Shows what is waiting to sync and drains it the moment the network returns.
 * Draining is sequential and only removes an item once the server has taken it,
 * so a failure mid-queue leaves the rest intact rather than losing them.
 */
export function Outbox() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingExpense[]>([]);
  const [draining, setDraining] = useState(false);

  useEffect(() => {
    const sync = () => setPending(readOutbox());
    sync();
    window.addEventListener("pennywise:outbox", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pennywise:outbox", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const drain = useCallback(async () => {
    if (draining || !navigator.onLine) return;
    const queue = readOutbox();
    if (queue.length === 0) return;

    setDraining(true);
    const remaining = [...queue];
    try {
      while (remaining.length > 0) {
        const item = remaining[0];
        await logExpense({
          categoryId: item.categoryId,
          amountMinor: item.amountMinor,
          note: item.note,
          eventId: item.eventId,
        });
        remaining.shift();
        writeOutbox(remaining);
      }
      router.refresh();
    } catch {
      writeOutbox(remaining);
    } finally {
      setDraining(false);
    }
  }, [draining, router]);

  useEffect(() => {
    window.addEventListener("online", drain);
    // Deferred a tick so syncing never delays the first paint of the tap grid.
    const timer = setTimeout(drain, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", drain);
    };
  }, [drain]);

  if (pending.length === 0) return null;

  const total = pending.reduce((n, p) => n + p.amountMinor, 0);

  return (
    <section className="px-6">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-card border border-gold-500/40 bg-ink-700 px-4 py-3"
      >
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full bg-gold-500 ${draining ? "animate-pulse" : ""}`}
        />
        <p className="flex-1 text-xs text-sky-200">
          {pending.length} {pending.length === 1 ? "entry" : "entries"} waiting to
          sync · {formatMinor(total)}
        </p>
        <button
          type="button"
          onClick={drain}
          className="min-h-11 text-xs font-semibold text-gold-500"
        >
          {draining ? "Syncing" : "Retry"}
        </button>
      </div>
    </section>
  );
}

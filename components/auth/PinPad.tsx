"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { setPin, unlock } from "@/app/lock-actions";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
const LENGTH = 6;

export function PinPad({ needsSetup }: { needsSetup: boolean }) {
  const router = useRouter();
  const [pin, setPinValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(value: string) {
    setBusy(true);
    setError(null);
    const result = needsSetup ? await setPin(value) : await unlock(value);
    if (result.ok) {
      router.replace("/");
      router.refresh();
      return;
    }
    setError(result.message);
    setPinValue("");
    setBusy(false);
  }

  function press(key: string) {
    if (busy || key === "") return;
    if (key === "del") return setPinValue(pin.slice(0, -1));
    if (pin.length >= LENGTH) return;

    const next = pin + key;
    setPinValue(next);
    if (next.length === LENGTH) submit(next);
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-8">
      <div>
        <p className="text-center text-sm text-sky-200">
          {needsSetup ? "Choose a six-digit PIN" : "Enter your PIN"}
        </p>
        <div className="mt-5 flex justify-center gap-3" aria-label="PIN entry">
          {Array.from({ length: LENGTH }, (_, i) => (
            <span
              key={i}
              /* An empty slot needs an outline: a dark fill on a dark ground
                 is invisible, and this is the one place feedback must be exact. */
              className={`size-3.5 rounded-full ${
                i < pin.length ? "bg-gold-500" : "border border-ink-500 bg-ink-800"
              }`}
            />
          ))}
        </div>
        <p
          role="status"
          aria-live="polite"
          className="mt-4 h-5 text-center text-xs text-gold-300"
        >
          {error ?? ""}
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : (
            <motion.button
              key={i}
              type="button"
              onClick={() => press(key)}
              whileTap={{ scale: 0.92, backgroundColor: "#17275e" }}
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
              aria-label={key === "del" ? "Delete" : key}
              className="flex min-h-16 items-center justify-center rounded-2xl bg-void/60 text-2xl font-semibold text-paper"
            >
              {key === "del" ? "⌫" : key}
            </motion.button>
          ),
        )}
      </div>
    </div>
  );
}

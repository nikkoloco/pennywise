"use client";

import { motion } from "motion/react";
import { pressAmountKey } from "@/lib/money";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];

type Props = { draft: string; onChange: (next: string) => void };

/**
 * Amounts are typed in whole pesos, the way they are said out loud, and the
 * decimal key is there for the rare amount that needs it. The draft string is
 * the value rather than a number, because "250" and "250." differ only in what
 * comes next.
 */
export function Keypad({ draft, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <motion.button
          key={key}
          type="button"
          onClick={() => onChange(pressAmountKey(draft, key))}
          whileTap={{ scale: 0.93, backgroundColor: "var(--color-ink-600)" }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          aria-label={key === "del" ? "Delete" : key === "." ? "Decimal point" : key}
          className="flex min-h-14 items-center justify-center rounded-2xl bg-void/60 text-2xl font-semibold text-paper"
        >
          {key === "del" ? <BackspaceIcon /> : key}
        </motion.button>
      ))}
    </div>
  );
}

function BackspaceIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9L3 12z" />
      <path d="M12 9.5l5 5M17 9.5l-5 5" />
    </svg>
  );
}

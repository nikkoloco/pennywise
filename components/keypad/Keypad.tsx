"use client";

import { motion } from "motion/react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"];

/** Nine digits of centavos is far more than anyone logs in one go. */
const MAX = 99_999_999;

type Props = { value: number; onChange: (next: number) => void };

/**
 * Amounts fill from the right in centavos, so 1-2-5 reads as 1.25 and no
 * decimal key is ever needed.
 */
export function Keypad({ value, onChange }: Props) {
  function press(key: string) {
    if (key === "del") return onChange(Math.floor(value / 10));
    const next = key === "00" ? value * 100 : value * 10 + Number(key);
    if (next <= MAX) onChange(next);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <motion.button
          key={key}
          type="button"
          onClick={() => press(key)}
          whileTap={{ scale: 0.93, backgroundColor: "#17275e" }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          aria-label={key === "del" ? "Delete" : key}
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

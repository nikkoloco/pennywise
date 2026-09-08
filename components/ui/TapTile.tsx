"use client";

import { motion } from "motion/react";
import { formatMinor } from "@/lib/money";

type Props = {
  emoji: string;
  label: string;
  /** Set means one tap logs it outright; null opens the keypad instead. */
  amountMinor?: number | null;
  onPress?: () => void;
  /** The trailing tile that adds a new one, drawn as an outline. */
  addTile?: boolean;
};

/**
 * The core control of the app. Sized so a thumb can hit it without looking,
 * and it flashes on press so a tap is confirmed without reading anything.
 */
export function TapTile({
  emoji,
  label,
  amountMinor = null,
  onPress,
  addTile = false,
}: Props) {
  return (
    <motion.button
      type="button"
      onClick={onPress}
      whileTap={{ scale: 0.94, backgroundColor: "#17275e" }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-card p-2 ${
        addTile
          ? "border border-dashed border-ink-500 text-sky-300"
          : "border border-ink-500 bg-ink-700"
      }`}
    >
      <span className={addTile ? "text-2xl leading-none font-light" : "text-2xl leading-none"}>
        {emoji}
      </span>
      <span className="text-xs font-medium text-sky-200">{label}</span>
      {addTile ? null : amountMinor === null ? (
        <span className="text-[10px] text-sky-400">tap to enter</span>
      ) : (
        <span className="text-[11px] font-bold text-gold-500">
          {formatMinor(amountMinor)}
        </span>
      )}
    </motion.button>
  );
}

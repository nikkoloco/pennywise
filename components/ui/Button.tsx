"use client";

import { motion } from "motion/react";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit";
  className?: string;
};

const VARIANTS = {
  primary: "bg-gold-500 text-ink-900",
  secondary: "bg-ink-600 text-sky-100 border border-ink-500",
  ghost: "text-sky-300",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
}: Props) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      /* 44px floor keeps every control inside Apple's minimum tap target. */
      className={`min-h-11 rounded-full px-6 text-base font-bold ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

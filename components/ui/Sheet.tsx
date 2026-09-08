"use client";

import { AnimatePresence, motion } from "motion/react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

/** Bottom sheet. The keypad, day details and event editors all ride on this. */
export function Sheet({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-void/70"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            className="safe-bottom fixed inset-x-0 bottom-0 z-50 rounded-t-sheet border-t border-ink-500 bg-ink-800 px-5 pt-3 pb-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-500" />
            {title && (
              <h2 className="mb-4 text-center text-sm font-semibold text-sky-200">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

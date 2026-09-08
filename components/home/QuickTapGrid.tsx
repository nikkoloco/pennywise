"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { TapTile } from "@/components/ui/TapTile";
import { SAMPLE_TILES } from "@/lib/sample";

/**
 * Phase 1 renders the grid and the sheet it opens. The keypad inside the sheet
 * and the actual write path arrive in Phase 2.
 */
export function QuickTapGrid() {
  const [pending, setPending] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {SAMPLE_TILES.map((tile) => (
          <TapTile
            key={tile.id}
            emoji={tile.emoji}
            label={tile.label}
            amountMinor={tile.amountMinor}
            onPress={() => setPending(tile.label)}
          />
        ))}
      </div>

      <Sheet open={pending !== null} onClose={() => setPending(null)} title={pending ?? ""}>
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="text-center text-sm text-sky-200">
            The keypad lands in Phase 2. This sheet is here so the motion and
            reach can be judged on a real phone first.
          </p>
          <Button onClick={() => setPending(null)}>Close</Button>
        </div>
      </Sheet>
    </>
  );
}

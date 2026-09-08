"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Amount } from "@/components/ui/Amount";
import type { byCategory } from "@/lib/insights";

type Slice = ReturnType<typeof byCategory>[number];

type Props = {
  slices: Slice[];
  total: number;
  selected: string | null;
  onSelect: (name: string | null) => void;
};

export function CategoryDonut({ slices, total, selected, onSelect }: Props) {
  return (
    <div className="relative">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="name"
              innerRadius="68%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
              onClick={(slice: { name?: string }) =>
                onSelect(slice.name === selected ? null : (slice.name ?? null))
              }
            >
              {slices.map((s) => (
                <Cell
                  key={s.name}
                  fill={`var(--color-${s.color})`}
                  opacity={selected === null || selected === s.name ? 1 : 0.25}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Centre of the donut carries the figure the ring is describing. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {/* Sized to sit inside the hole; "lg" overruns the ring on long totals. */}
        <Amount
          minor={selected ? (slices.find((s) => s.name === selected)?.total ?? 0) : total}
          size="md"
        />
        <p className="mt-1 text-xs text-sky-300">{selected ?? "total"}</p>
      </div>
    </div>
  );
}

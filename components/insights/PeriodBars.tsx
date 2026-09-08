"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, XAxis } from "recharts";
import { formatCompact } from "@/lib/money";

type Props = { data: { label: string; total: number }[] };

export function PeriodBars({ data }: Props) {
  const heaviest = Math.max(...data.map((d) => d.total), 0);

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-sky-300)", fontSize: 10 }}
            interval={0}
          />
          <Bar
            dataKey="total"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
            label={{
              position: "top",
              fill: "var(--color-sky-300)",
              fontSize: 9,
              formatter: (v: unknown) => (Number(v) > 0 ? formatCompact(Number(v)) : ""),
            }}
          >
            {/* Only the heaviest bar earns gold; the rest stay structural blue. */}
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  d.total > 0 && d.total === heaviest
                    ? "var(--color-gold-500)"
                    : "var(--color-sky-400)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

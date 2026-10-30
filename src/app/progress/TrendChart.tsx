"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { trend } from "@/lib/analytics";

type Point = ReturnType<typeof trend>[number];

/** Single series (net score %), so no legend — the card title names it. */
export default function TrendChart({ data }: { data: Point[] }) {
  return (
    <div className="h-56 w-full" role="img" aria-label={`Score trend over the last ${data.length} tests`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--hairline)" />
          <XAxis dataKey="i" tickLine={false} axisLine={false} tick={{ fill: "var(--faint)", fontSize: 12 }} />
          <YAxis
            domain={[(min: number) => Math.min(0, Math.floor(min / 10) * 10), 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--faint)", fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: "var(--faint)", strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              const p = active && payload?.[0]?.payload as Point | undefined;
              if (!p) return null;
              return (
                <div className="glass-strong rounded-xl px-3 py-2 text-xs">
                  <div className="font-semibold text-fg">{p.title}</div>
                  <div className="text-muted">{new Date(p.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</div>
                  <div className="mt-1 text-fg">
                    Score <b>{p.score}%</b> · Accuracy <b>{p.accuracy}%</b>
                  </div>
                </div>
              );
            }}
          />
          <Line
            type="linear"
            dataKey="score"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--primary)", stroke: "var(--glass-strong)", strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: "var(--glass-strong)", strokeWidth: 2 }}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

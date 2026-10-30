"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { mulberry32 } from "@/lib/random";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7"];

/** Subtle one-shot burst for a personal best. Renders nothing for reduced-motion users. */
export function Confetti({ count = 46 }: { count?: number }) {
  const reduce = useReducedMotion();
  const bits = useMemo(() => {
    const rnd = mulberry32(count * 7919);
    return Array.from({ length: count }, (_, i) => ({
        x: (rnd() - 0.5) * 520,
        y: -(160 + rnd() * 260),
        r: rnd() * 540 - 270,
        d: 0.9 + rnd() * 0.8,
        c: COLORS[i % COLORS.length],
        w: 6 + rnd() * 5,
      }));
  }, [count]);
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-1/3 z-40 flex justify-center" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[2px]"
          style={{ width: b.w, height: b.w * 0.45, background: b.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 420], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: b.d + 0.9, ease: "easeOut", times: [0, 0.4, 1] }}
        />
      ))}
    </div>
  );
}

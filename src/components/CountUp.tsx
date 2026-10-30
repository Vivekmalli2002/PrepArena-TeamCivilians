"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function CountUp({ to, decimals = 0, duration = 1.1 }: { to: number; decimals?: number; duration?: number }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) return;
    const c = animate(0, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: setV });
    return () => c.stop();
  }, [to, duration, reduce]);
  return <span className="tabular">{(reduce ? to : v).toFixed(decimals)}</span>;
}

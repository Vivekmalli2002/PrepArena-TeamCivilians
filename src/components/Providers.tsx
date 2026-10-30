"use client";

import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { PwaManager } from "./PwaManager";

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useApp((s) => s.theme);

  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  return (
    <MotionConfig reducedMotion="user">
      {children}
      <PwaManager />
    </MotionConfig>
  );
}

"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useApp, useHydrated, type Theme } from "@/lib/store";

const ORDER: Theme[] = ["system", "light", "dark"];
const ICON = { system: Monitor, light: Sun, dark: Moon };

export function ThemeToggle() {
  const hydrated = useHydrated();
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const t = hydrated ? theme : "system";
  const Icon = ICON[t];
  const next = ORDER[(ORDER.indexOf(t) + 1) % ORDER.length];
  return (
    <button
      onClick={() => setTheme(next)}
      className="grid size-11 place-items-center rounded-xl text-muted transition hover:bg-hairline hover:text-fg"
      aria-label={`Theme: ${t}. Switch to ${next}`}
      title={`Theme: ${t}`}
    >
      <Icon size={20} />
    </button>
  );
}

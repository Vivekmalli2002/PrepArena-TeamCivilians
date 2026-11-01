"use client";

import { Timer } from "lucide-react";
import Link from "next/link";
import { atMs, partsLeft } from "@/lib/countdown";
import { useApp } from "@/lib/store";
import { useNow } from "./useNow";

/** Home-screen strip for the pinned countdown (hidden when nothing is pinned). */
export function PinnedCountdown() {
  const c = useApp((s) => s.countdowns.find((x) => x.pinned));
  const now = useNow(1000);
  if (!c) return null;
  const p = partsLeft(atMs(c), now);
  return (
    <Link href="/countdown" className="glass mt-6 flex items-center gap-4 rounded-3xl p-4 transition hover:-translate-y-0.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
        <Timer size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{c.title}</span>
        <span className="block text-xs text-muted">{c.kind === "exam" ? "Exam date" : "Target date"}</span>
      </span>
      <span className="text-right font-display text-lg font-extrabold tabular">
        {p.ms <= 0 ? "Overdue" : `${p.days}d ${String(p.hours).padStart(2, "0")}h ${String(p.minutes).padStart(2, "0")}m`}
      </span>
    </Link>
  );
}

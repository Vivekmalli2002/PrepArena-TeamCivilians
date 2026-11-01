"use client";

import { Pin } from "lucide-react";
import type { Countdown } from "@/lib/extras";
import { atMs, partsLeft } from "@/lib/countdown";
import { cx } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");

/** The big pinned countdown: Days · Hrs · Mins · Secs, ticking every second. */
export function CountdownHero({ c, now }: { c: Countdown; now: number }) {
  const p = partsLeft(atMs(c), now);
  const over = p.ms <= 0;
  const when = new Date(c.at);
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[32px] p-6 text-center shadow-lg",
        c.kind === "exam" ? "bg-gradient-to-b from-teal-200 to-teal-400 text-teal-950" : "bg-gradient-to-b from-amber-100 to-amber-300 text-amber-950",
      )}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-current/20 bg-white/30 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em]">
        <Pin size={12} /> Pinned countdown
      </span>
      <h2 className="mt-4 font-display text-[26px] font-extrabold leading-tight sm:text-3xl">{c.title}</h2>
      <span className="mt-2 inline-block rounded-full bg-white/30 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider">
        {c.kind === "exam" ? "Exam date" : "Target date"}
        {c.done ? " · done" : over ? " · time is up" : ""}
      </span>
      <div className="mt-5 grid grid-cols-4 gap-2.5" role="timer" aria-label={`${p.days} days ${p.hours} hours ${p.minutes} minutes ${p.seconds} seconds ${over ? "overdue" : "left"}`}>
        {[
          ["Days", p.days],
          ["Hrs", p.hours],
          ["Mins", p.minutes],
          ["Secs", p.seconds],
        ].map(([label, v]) => (
          <div key={label as string}>
            <div className="rounded-2xl bg-white/45 py-3 font-display text-3xl font-extrabold tabular shadow-sm sm:text-4xl">{pad(v as number)}</div>
            <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider opacity-70">{label}</div>
          </div>
        ))}
      </div>
      {over && !c.done && <p className="mt-3 text-sm font-semibold">Overdue by the time shown above.</p>}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
        <span className="rounded-full bg-white/30 px-3 py-1">{when.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        <span className="rounded-full bg-white/30 px-3 py-1">{when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
      </div>
    </div>
  );
}

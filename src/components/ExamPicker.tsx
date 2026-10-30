"use client";

import { Check } from "lucide-react";
import { EXAMS } from "@/content/catalog";
import { cx } from "./ui";

export function ExamPicker({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const launch = EXAMS.filter((e) => e.status === "launch");
  const later = EXAMS.filter((e) => e.status === "later");
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Target exam">
      {launch.map((e) => {
        const on = value === e.id;
        return (
          <button
            key={e.id}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(e.id)}
            className={cx(
              "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition",
              on ? "border-primary bg-primary-soft" : "border-hairline bg-glass hover:border-primary/40",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{e.name}</div>
              <div className="text-sm text-muted">{e.blurb}</div>
            </div>
            <span
              className={cx(
                "grid size-6 shrink-0 place-items-center rounded-full border-2",
                on ? "border-primary bg-primary text-on-primary" : "border-hairline",
              )}
            >
              {on && <Check size={14} strokeWidth={3} />}
            </span>
          </button>
        );
      })}
      <p className="px-1 pt-3 text-xs font-bold uppercase tracking-wider text-faint">Coming later</p>
      <div className="flex flex-wrap gap-2">
        {later.map((e) => (
          <span key={e.id} className="rounded-full border border-hairline px-3 py-1.5 text-sm text-muted">
            {e.short}
          </span>
        ))}
      </div>
    </div>
  );
}

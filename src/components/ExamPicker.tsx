"use client";

import { Check } from "lucide-react";
import { EXAMS, type Exam } from "@/content/catalog";
import { cx } from "./ui";

export function ExamPicker({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const row = (e: Exam) => {
    const on = value === e.id;
    return (
      <button
        key={e.id}
        role="radio"
        aria-checked={on}
        onClick={() => onChange(e.id)}
        className={cx(
          "flex w-full items-center gap-3 rounded-2xl border text-left transition",
          e.priority ? "p-4" : "px-4 py-3",
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
  };
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Target exam">
      {EXAMS.filter((e) => e.priority).map(row)}
      <p className="px-1 pt-3 text-xs font-bold uppercase tracking-wider text-faint">More APPSC exams</p>
      {EXAMS.filter((e) => !e.priority).map(row)}
    </div>
  );
}

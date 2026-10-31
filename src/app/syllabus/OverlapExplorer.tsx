"use client";

import { useMemo, useState } from "react";
import { EXAMS, type ExamId } from "@/content/catalog";
import { unitOverlap, type OverlapClass } from "@/content/registry";
import { cx } from "@/components/ui";

const LABEL: Record<OverlapClass, string> = {
  "common-all": "Common to every selected exam",
  "shared-some": "Shared by some of the selected exams",
  unique: "Only one selected exam lists it",
};

export function OverlapExplorer() {
  const [sel, setSel] = useState<ExamId[]>(["group1", "group2"]);
  const short = (id: string) => EXAMS.find((e) => e.id === id)?.short ?? id;
  const rows = useMemo(() => (sel.length ? unitOverlap(sel) : []), [sel]);
  const groups = (["common-all", "shared-some", "unique"] as OverlapClass[]).map((c) => ({ c, rows: rows.filter((r) => r.cls === c) }));
  const toggle = (id: ExamId) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <section className="glass rounded-3xl p-4 sm:p-5">
      <h2 className="font-display text-lg font-bold">Compare any exams</h2>
      <p className="mt-1 text-sm text-muted">
        Pick two or more exams. Each syllabus unit is shown with the exams that list it. “Listed” means it appears in a paper of that exam; depth
        can still differ, so treat shared units as <b>needs review</b> for exact vs partial overlap.
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Exams to compare">
        {EXAMS.map((e) => (
          <button
            key={e.id}
            onClick={() => toggle(e.id)}
            aria-pressed={sel.includes(e.id)}
            className={cx(
              "rounded-xl border-2 px-3 py-1.5 text-sm font-semibold transition-colors",
              sel.includes(e.id) ? "border-primary bg-primary-soft text-primary" : "border-hairline text-muted hover:border-primary/40",
            )}
          >
            {e.short}
          </button>
        ))}
      </div>
      {sel.length < 2 && <p className="mt-4 text-sm text-muted">Select at least two exams to compare.</p>}
      {sel.length >= 2 &&
        groups.map(({ c, rows: r }) => (
          <div key={c} className="mt-5">
            <h3 className="font-semibold">
              {LABEL[c]} <span className="font-normal text-muted">· {r.length} units</span>
            </h3>
            {r.length === 0 ? (
              <p className="mt-1 text-sm text-muted">None.</p>
            ) : (
              <ul className="mt-2 divide-y divide-hairline text-sm">
                {r.map((u) => (
                  <li key={u.subjectId + u.unit} className="py-2">
                    <p className="font-medium">{u.unit}</p>
                    <p className="text-xs text-muted">
                      {u.subject} · listed in: {u.selectedListed.map(short).join(", ")}
                      {u.cls !== "common-all" && sel.filter((x) => !u.selectedListed.includes(x)).length > 0 && (
                        <> · not in: {sel.filter((x) => !u.selectedListed.includes(x)).map(short).join(", ")}</>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      <p className="mt-4 text-xs text-faint">
        Evidence: units transcribed from the YUDDAM 2027 overlap masters and the 2026 notifications (src/content/catalog.ts). Classifications are
        AI-assisted and awaiting editorial review; they are not an official statement.
      </p>
    </section>
  );
}

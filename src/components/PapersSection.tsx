"use client";

import { ChevronRight, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EXAMS, examById, examsSharingPaper, papersForExam, SUBJECTS, type Subject } from "@/content/catalog";
import { Card, Sheet, cx } from "./ui";

/** The student's exam as papers → subjects, with what is shared with other exams. */
export function PapersSection({ examId, counts }: { examId: string; counts: Record<string, number> }) {
  const [open, setOpen] = useState<Subject | null>(null);
  const papers = papersForExam(examId);
  return (
    <>
      <div className="space-y-3">
        {papers.map((p) => {
          const shared = examsSharingPaper(p.id, examId);
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold leading-snug">{p.name}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {p.marks ? `${p.marks} marks` : "Marks per notification"}
                    {shared.length > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 font-semibold text-primary">
                        <Share2 size={12} /> Shared with {shared.map((e) => e.short).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.subjects.map((sid) => {
                  const s = SUBJECTS[sid];
                  const has = (counts[sid] ?? 0) > 0;
                  return (
                    <button
                      key={sid}
                      onClick={() => setOpen(s)}
                      className={cx(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        has
                          ? "border-primary/40 bg-primary-soft text-primary hover:border-primary"
                          : "border-hairline text-muted hover:border-primary/40",
                      )}
                    >
                      {s.name}
                      {has && " ✓"}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-faint">✓ = practice questions available. Tap a subject for its syllabus units.</p>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""} wide>
        {open && (
          <>
            {counts[open.id] ? (
              <Link
                href="/tests"
                className="mb-4 flex items-center justify-between rounded-2xl bg-primary-soft p-3 text-sm font-semibold text-primary"
              >
                {counts[open.id]} practice questions — open tests
                <ChevronRight size={16} />
              </Link>
            ) : (
              <p className="mb-4 rounded-2xl bg-hairline p-3 text-sm text-muted">
                Questions for this subject are coming. The syllabus below shows what to read.
              </p>
            )}
            <ol className="space-y-2.5">
              {open.units.map((u, i) => {
                const mine = u.exams.includes(examId as never);
                const others = u.exams.filter((e) => e !== examId);
                return (
                  <li key={i} className={cx("flex gap-3", !mine && "opacity-55")}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-hairline text-xs font-bold text-muted">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium leading-snug">
                        {u.title}
                        {!mine && <span className="ml-1.5 text-xs font-normal text-muted">(not in {examById(examId)?.short})</span>}
                      </div>
                      {others.length > 0 && (
                        <div className="mt-0.5 text-xs text-muted">
                          Also in: {others.map((e) => EXAMS.find((x) => x.id === e)?.short).join(", ")}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs text-faint">Source: YUDDAM 2027 APPSC overlap masters.</p>
          </>
        )}
      </Sheet>
    </>
  );
}

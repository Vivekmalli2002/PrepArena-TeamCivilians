"use client";

import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { EXAMS, type ExamId } from "@/content/catalog";
import { Button, Card, Chip, PageSkeleton, cx } from "@/components/ui";
import { examChecklist, paperKeys, progressOf, subjectKeys, uniqueKeys, type ChecklistPaper, type ChecklistSubject } from "@/lib/syllabus";
import { useApp, useHydrated } from "@/lib/store";

export function SyllabusChecklist() {
  const hydrated = useHydrated();
  const syll = useApp((s) => s.syll);
  const myExam = useApp((s) => s.profile?.examId);
  const [picked, setPicked] = useState<ExamId | null>(null);
  const examId = (picked ?? (EXAMS.some((e) => e.id === myExam) ? (myExam as ExamId) : EXAMS[0].id)) as ExamId;
  const papers = useMemo(() => examChecklist(examId), [examId]);
  const all = useMemo(() => uniqueKeys(papers), [papers]);
  if (!hydrated) return <PageSkeleton />;

  const total = progressOf(all, syll);
  const exam = EXAMS.find((e) => e.id === examId)!;
  const pct = total.total ? Math.round((total.done / total.total) * 100) : 0;

  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Syllabus checklist</h1>
      <p className="mt-1 text-sm text-muted">
        Every paper, subject and unit of your exam. Tick a unit when you have finished it. A unit that other exams list too (Disaster Management, AP
        History, Polity …) is ticked <b>everywhere at once</b>, so you never study it twice.
      </p>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Exam">
        {EXAMS.map((e) => {
          const p = progressOf(uniqueKeys(examChecklist(e.id)), syll);
          return (
            <Chip key={e.id} on={e.id === examId} onClick={() => setPicked(e.id)}>
              {e.short} · {p.done}/{p.total}
            </Chip>
          );
        })}
      </div>

      <Card className="mt-4 p-4">
        <div className="font-semibold">{exam.name}</div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div className="whitespace-nowrap font-display text-3xl font-bold tabular">
            {total.done}
            <span className="text-lg font-semibold text-muted"> / {total.total}</span>
            <span className="ml-2 text-base font-semibold text-muted">{pct}%</span>
          </div>
          <div className="text-right text-xs text-muted">units done · a unit listed in two papers counts once</div>
        </div>
        <Bar value={total.done} max={total.total} className="mt-3" />
      </Card>

      <div className="mt-4 grid gap-5">
        {papers.map((p, i) => (
          <Paper key={p.id} paper={p} firstOpen={i === 0} examId={examId} />
        ))}
      </div>
    </div>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-hairline", className)} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

function Paper({ paper, firstOpen, examId }: { paper: ChecklistPaper; firstOpen: boolean; examId: ExamId }) {
  const syll = useApp((s) => s.syll);
  const p = progressOf(paperKeys(paper), syll);
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold leading-snug">{paper.name}</h2>
        <span className="shrink-0 text-sm font-semibold tabular text-muted">
          {p.done}/{p.total}
        </span>
      </div>
      <Bar value={p.done} max={p.total} className="mt-1.5" />
      <div className="mt-3 grid gap-2.5">
        {paper.subjects.map((s, i) => (
          <Subject key={`${examId}.${paper.id}.${s.id}`} subject={s} startOpen={firstOpen && i === 0} />
        ))}
      </div>
    </section>
  );
}

function Subject({ subject, startOpen }: { subject: ChecklistSubject; startOpen: boolean }) {
  const syll = useApp((s) => s.syll);
  const setSyll = useApp((s) => s.setSyll);
  const [open, setOpen] = useState(startOpen);
  const keys = subjectKeys(subject);
  const p = progressOf(keys, syll);
  const fin = p.total > 0 && p.done === p.total;
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left">
        <span className={cx("grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold tabular", fin ? "bg-good text-white" : "bg-primary-soft text-primary")}>
          {fin ? <Check size={17} /> : p.done}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cx("block font-semibold leading-snug", fin && "text-muted line-through decoration-good/70 decoration-2")}>{subject.name}</span>
          <span className="block text-xs text-muted tabular">
            {p.done}/{p.total} units
          </span>
        </span>
        <ChevronDown size={18} className={cx("shrink-0 text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-hairline px-4 pb-4 pt-3">
          <div className="grid gap-2">
            {subject.units.map((u) => (
              <Unit key={u.key} k={u.key} no={u.no} title={u.title} alsoIn={u.alsoIn} />
            ))}
          </div>
          <div className="mt-3">
            <Button size="sm" variant={fin ? "outline" : "soft"} onClick={() => setSyll(keys, !fin)}>
              {fin ? (
                <>
                  <RotateCcw size={15} /> Clear this subject
                </>
              ) : (
                <>
                  <Check size={15} /> Tick the whole subject
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/** One unit row; the whole row is the tap target. */
function Unit({ k, no, title, alsoIn }: { k: string; no: number; title: string; alsoIn: string[] }) {
  const on = useApp((s) => !!s.syll[k]);
  const toggle = useApp((s) => s.toggleSyll);
  return (
    <button
      onClick={() => toggle(k)}
      role="checkbox"
      aria-checked={on}
      className={cx("flex w-full items-start gap-3 rounded-2xl border p-3 text-left text-[15px] transition", on ? "border-good/40 bg-good-soft/60" : "border-hairline hover:border-primary/40")}
    >
      <span className={cx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition", on ? "border-good bg-good text-white" : "border-hairline")}>{on && <Check size={14} />}</span>
      <span className="min-w-0 flex-1">
        <span className={cx("block leading-snug", on && "text-muted line-through decoration-good/70 decoration-2")}>
          <span className="mr-1.5 text-xs font-semibold text-muted">{no}.</span>
          {title}
        </span>
        {alsoIn.length > 0 && (
          <span className="mt-1 block text-xs text-muted">
            {on ? "Done in every exam that lists it: " : "Also in: "}
            {alsoIn.join(" · ")}
          </span>
        )}
      </span>
    </button>
  );
}

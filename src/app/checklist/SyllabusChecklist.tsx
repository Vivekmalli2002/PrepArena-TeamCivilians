"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { EXAMS, type ExamId } from "@/content/catalog";
import { Card, Chip, PageSkeleton, cx } from "@/components/ui";
import { examChecklist, paperKeys, progressOf, uniqueKeys, type ChecklistPaper } from "@/lib/syllabus";
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
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Subjects checklist</h1>
      <p className="mt-1 text-sm text-muted">
        Every paper of your exam with its subjects. Tick a subject when you have finished it and it is struck off with a red line. A subject that other exams
        carry too (Environmental Science, AP &amp; Indian History, Polity …) is struck off <b>in every exam at once</b>.
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
          <div className="text-right text-xs text-muted">subjects done · a subject in two papers counts once</div>
        </div>
        <Bar value={total.done} max={total.total} className="mt-3" />
      </Card>

      <div className="mt-4 grid gap-5">
        {papers.map((p) => (
          <Paper key={p.id} paper={p} />
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

function Paper({ paper }: { paper: ChecklistPaper }) {
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
      <div className="mt-3 grid gap-2">
        {paper.subjects.map((s) => (
          <SubjectRow key={s.key} k={s.key} name={s.name} alsoIn={s.alsoIn} />
        ))}
      </div>
    </section>
  );
}

/** One subject row; the whole row is the tap target. Done = struck off with a red line. */
function SubjectRow({ k, name, alsoIn }: { k: string; name: string; alsoIn: string[] }) {
  const on = useApp((s) => !!s.syll[k]);
  const toggle = useApp((s) => s.toggleSyll);
  return (
    <button
      onClick={() => toggle(k)}
      role="checkbox"
      aria-checked={on}
      className={cx("flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition", on ? "border-bad/40 bg-bad-soft" : "border-hairline hover:border-primary/40")}
    >
      <span className={cx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition", on ? "border-bad bg-bad text-white" : "border-hairline")}>{on && <Check size={14} />}</span>
      <span className="min-w-0 flex-1">
        <span className={cx("block text-[16px] font-semibold leading-snug", on && "text-muted line-through decoration-bad decoration-[3px]")}>{name}</span>
        {alsoIn.length > 0 && (
          <span className="mt-1 block text-xs text-muted">
            {on ? "Struck off in every exam that carries it: " : "Also in: "}
            {alsoIn.slice(0, 3).join(" · ")}
            {alsoIn.length > 3 && ` · +${alsoIn.length - 3} more`}
          </span>
        )}
      </span>
    </button>
  );
}

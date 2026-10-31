"use client";

import { Minus, Plus, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { chapterWeight, patternsForExam, type ExamPattern } from "@/content/patterns";
import type { LoadedBank } from "@/lib/bank";
import { useApp } from "@/lib/store";
import { patternMock } from "@/lib/tests";
import type { TestConfig } from "@/lib/types";
import { Button, Card, Sheet } from "./ui";

const BASIS: Record<ExamPattern["basis"], string> = {
  notification: "Official pattern",
  "past-papers": "Weighted by past papers",
  assumed: "Seats shared equally",
};

/** Questions available to a pattern section in the student's bank. */
function available(bank: LoadedBank, p: ExamPattern, i: number) {
  const s = p.sections[i];
  return bank.topics
    .filter((t) => s.subjects.includes(t.subject) && (!s.chapters || s.chapters.includes(t.name)))
    .reduce((n, t) => n + t.qids.length, 0);
}

export function PatternMocks({ bank, examId, onStart }: { bank: LoadedBank; examId?: string; onStart: (c: TestConfig | null) => void }) {
  const qstats = useApp((s) => s.qstats);
  const [custom, setCustom] = useState<ExamPattern | null>(null);
  const patterns = useMemo(
    () => patternsForExam(examId).filter((p) => p.sections.some((_, i) => available(bank, p, i) > 0)),
    [bank, examId],
  );
  if (!patterns.length) return null;
  return (
    <>
      <div className="mt-5 grid gap-3">
        {patterns.map((p) => {
          const have = p.sections.reduce((n, _, i) => n + Math.min(available(bank, p, i), p.sections[i].seats), 0);
          return (
            <Card key={p.id} strong className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{BASIS[p.basis]}</p>
              <h2 className="mt-1 font-display text-xl font-bold">{p.title}</h2>
              <p className="mt-1 text-sm text-muted">{p.note}</p>
              <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {p.sections.map((s, i) => (
                  <li key={s.label} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{s.label}</span>
                    <span className="tabular font-semibold">
                      {s.seats}
                      <span className="ml-1 text-xs font-normal text-muted">/ {available(bank, p, i)} in bank</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button onClick={() => onStart(patternMock(bank, p, chapterWeight, qstats))}>
                  <Timer size={18} /> Start {have < p.questions ? have : p.questions} Q · {p.minutes} min
                </Button>
                <Button variant="soft" onClick={() => setCustom(p)}>
                  Customise
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <Sheet open={!!custom} onClose={() => setCustom(null)} title={custom?.title ?? ""} wide>
        {custom && (
          <Customise
            key={custom.id}
            bank={bank}
            pattern={custom}
            onStart={(c) => {
              setCustom(null);
              onStart(c);
            }}
          />
        )}
      </Sheet>
    </>
  );
}

function Customise({ bank, pattern, onStart }: { bank: LoadedBank; pattern: ExamPattern; onStart: (c: TestConfig | null) => void }) {
  const qstats = useApp((s) => s.qstats);
  const [seats, setSeats] = useState(() => pattern.sections.map((s, i) => Math.min(s.seats, available(bank, pattern, i))));
  const [minutes, setMinutes] = useState<number | null>(null);
  const total = seats.reduce((a, b) => a + b, 0);
  const mins = minutes ?? Math.max(1, Math.round((total / pattern.questions) * pattern.minutes));
  const set = (i: number, v: number) =>
    setSeats((x) => x.map((y, j) => (j === i ? Math.max(0, Math.min(available(bank, pattern, i), v)) : y)));
  return (
    <div>
      <p className="text-sm text-muted">
        Choose how many questions you want from each part. The real paper has {pattern.questions} questions in {pattern.minutes} minutes.
      </p>
      <div className="mt-4 grid gap-2">
        {pattern.sections.map((s, i) => {
          const max = available(bank, pattern, i);
          return (
            <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-hairline p-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-snug">{s.label}</div>
                <div className="text-xs text-muted">
                  real paper: {s.seats} · in bank: {max}
                </div>
              </div>
              <button aria-label={`Fewer ${s.label}`} className="grid size-9 place-items-center rounded-full border border-hairline" onClick={() => set(i, seats[i] - 1)}>
                <Minus size={16} />
              </button>
              <input
                aria-label={`${s.label} questions`}
                type="number"
                inputMode="numeric"
                min={0}
                max={max}
                value={seats[i]}
                onChange={(e) => set(i, Number(e.target.value) || 0)}
                className="h-9 w-16 rounded-xl border border-hairline bg-transparent text-center font-semibold tabular"
              />
              <button aria-label={`More ${s.label}`} className="grid size-9 place-items-center rounded-full border border-hairline" onClick={() => set(i, seats[i] + 1)}>
                <Plus size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="font-display text-xl font-bold tabular">{total} questions</span>
        <label className="flex items-center gap-2 text-sm">
          Minutes
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={mins}
            onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
            className="h-9 w-20 rounded-xl border border-hairline bg-transparent text-center font-semibold tabular"
          />
        </label>
      </div>
      <Button
        size="lg"
        className="mt-4 w-full"
        disabled={!total}
        onClick={() =>
          onStart(
            patternMock(
              bank,
              { ...pattern, minutes: mins, sections: pattern.sections.map((s, i) => ({ ...s, seats: seats[i] })) },
              chapterWeight,
              qstats,
            ),
          )
        }
      >
        <Timer size={18} /> Start custom mock
      </Button>
    </div>
  );
}

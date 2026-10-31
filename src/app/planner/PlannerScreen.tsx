"use client";

import { CalendarDays, Check, Circle, Play } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { examById } from "@/content/catalog";
import { chapterWeight, patternsForExam, PATTERNS } from "@/content/patterns";
import type { StudyPlan } from "@/lib/extras";
import { useExamBank } from "@/lib/useExamBank";
import { buildSchedule, daysBetween, subjectWeights, ymd, type PlanTask } from "@/lib/planner";
import { useApp, useHydrated } from "@/lib/store";
import { patternMock, topicSets, topicSetTest } from "@/lib/tests";
import { useStartTest } from "@/components/useStartTest";
import { Button, Card, Chip, PageSkeleton, SectionTitle, cx } from "@/components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PlannerScreen() {
  const hydrated = useHydrated();
  const { bank, fullBank } = useExamBank();
  const plan = useApp((s) => s.plan);
  const setPlan = useApp((s) => s.setPlan);
  const toggle = useApp((s) => s.toggleTask);
  const attempts = useApp((s) => s.attempts);
  const qstats = useApp((s) => s.qstats);
  const examId = useApp((s) => s.profile?.examId);
  const schemeId = examById(examId)?.schemeId ?? "appsc";
  const { start, dialog } = useStartTest();
  const today = ymd(new Date());

  const [date, setDate] = useState(plan?.examDate ?? "");
  const [mins, setMins] = useState(plan?.minutesPerDay ?? 90);
  const [rest, setRest] = useState<number[]>(plan?.restDays ?? [0]);
  const [editing, setEditing] = useState(false);

  const patterns = useMemo(() => patternsForExam(examId), [examId]);
  const schedule = useMemo(() => {
    if (!plan || !bank) return [];
    return buildSchedule({
      today: ymd(new Date(plan.createdAt)),
      examDate: plan.examDate,
      minutesPerDay: plan.minutesPerDay,
      restDays: plan.restDays,
      topics: bank.topics,
      subjectWeight: subjectWeights(patterns.flatMap((p) => p.sections)),
      mockPatterns: patterns.map((p) => ({ id: p.id, questions: p.questions, minutes: p.minutes, title: p.title })),
    });
  }, [plan, bank, patterns]);

  if (!hydrated || !bank) return <PageSkeleton />;

  const topicKey = (t: Extract<PlanTask, { kind: "topic" }>) => `topic:${t.topic}:${t.set}`;
  const isDone = (t: PlanTask) =>
    !!plan?.done[t.key] || (t.kind === "topic" && !!plan && attempts.some((a) => a.config.key === topicKey(t) && a.finishedAt >= plan.createdAt));

  const run = (t: PlanTask) => {
    if (t.kind === "topic") {
      const topic = bank.topics.find((x) => x.name === t.topic);
      if (!topic) return;
      const sets = topicSets(topic.qids);
      const set = sets[Math.min(t.set, sets.length - 1)];
      start(topicSetTest(topic.name, Math.min(t.set, sets.length - 1), set, "practice", schemeId));
    } else if (t.kind === "mock") {
      const p = PATTERNS.find((x) => x.id === t.patternId);
      if (p) start(patternMock(bank, p, chapterWeight, qstats));
    }
  };

  const createPlan = () => {
    if (!date || daysBetween(today, date) < 1) return;
    const next: StudyPlan = { examDate: date, minutesPerDay: mins, restDays: rest, createdAt: Date.now(), done: plan?.done ?? {} };
    setPlan(next);
    setEditing(false);
  };

  if (!plan || editing) {
    const left = date ? daysBetween(today, date) : null;
    return (
      <div>
        <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Study planner</h1>
        <p className="mt-1 text-sm text-muted">
          Tell us your exam date and how long you can study each day. We spread every topic of your exam over the days left —
          heaviest subjects first — and turn the last two weeks into mocks and revision.
        </p>
        <Card className="mt-5 space-y-5 p-5">
          <label className="block">
            <span className="text-sm font-bold">Exam date</span>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 block h-11 w-full rounded-xl border border-hairline bg-transparent px-3 sm:w-60"
            />
            {left != null && <span className="mt-1 block text-xs text-muted">{left > 0 ? `${left} days to go` : "Pick a date in the future"}</span>}
          </label>
          <label className="block">
            <span className="text-sm font-bold">Minutes a day</span>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min={30} max={360} step={15} value={mins} onChange={(e) => setMins(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="w-20 text-right font-display text-xl font-bold tabular">{mins} min</span>
            </div>
          </label>
          <div>
            <span className="text-sm font-bold">Rest days</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((d, i) => (
                <Chip key={d} on={rest.includes(i)} onClick={() => setRest((r) => (r.includes(i) ? r.filter((x) => x !== i) : [...r, i]))}>
                  {d}
                </Chip>
              ))}
            </div>
          </div>
          <Button size="lg" className="w-full" disabled={!date || (left ?? 0) < 1} onClick={createPlan}>
            <CalendarDays size={18} /> Create my plan
          </Button>
        </Card>
      </div>
    );
  }

  const daysLeft = daysBetween(today, plan.examDate);
  const all = schedule.flatMap((d) => d.tasks);
  const done = all.filter(isDone).length;
  const todayDay = schedule.find((d) => d.date === today);
  const upcoming = schedule.filter((d) => d.date > today).slice(0, 7);
  const missed = schedule.filter((d) => d.date < today).flatMap((d) => d.tasks).filter((t) => !isDone(t));

  const row = (t: PlanTask) => {
    const ok = isDone(t);
    return (
      <div key={t.key} className="flex items-center gap-3 rounded-2xl border border-hairline p-3">
        <button aria-label={ok ? "Mark not done" : "Mark done"} onClick={() => toggle(t.key)} className={cx("shrink-0", ok ? "text-good" : "text-faint")}>
          {ok ? <Check size={22} /> : <Circle size={22} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className={cx("font-semibold leading-snug", ok && "text-muted line-through")}>{t.label}</div>
          <div className="text-xs text-muted">
            {t.minutes} min{t.kind === "mock" && ` · ${t.questions} Q`}
          </div>
        </div>
        {t.kind === "mistakes" ? (
          <Link href="/mistakes" className="rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary">
            Open
          </Link>
        ) : (
          <Button size="sm" variant="soft" onClick={() => run(t)}>
            <Play size={15} /> Start
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
      {dialog}
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Study planner</h1>
      <Card strong className="mt-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Exam on {plan.examDate}</p>
            <p className="font-display text-3xl font-extrabold tabular">{Math.max(0, daysLeft)} days left</p>
          </div>
          <div className="text-right text-sm text-muted">
            <b className="text-fg tabular">{done}</b> of {all.length} tasks done · {plan.minutesPerDay} min/day
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-hairline">
          <div className="h-full rounded-full bg-primary" style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="soft" onClick={() => setEditing(true)}>
            Change plan
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPlan(null)}>
            Remove plan
          </Button>
        </div>
      </Card>

      <SectionTitle>Today · {todayDay?.phase === "revise" ? "revision stretch" : todayDay?.phase === "rest" ? "rest day" : "learning"}</SectionTitle>
      <div className="grid gap-2">
        {todayDay?.tasks.length ? todayDay.tasks.map(row) : <p className="text-muted">{todayDay?.phase === "rest" ? "Rest today — you earned it." : daysLeft <= 0 ? "Exam day. Good luck!" : "Nothing planned for today."}</p>}
      </div>

      {missed.length > 0 && (
        <>
          <SectionTitle>Catch up ({missed.length})</SectionTitle>
          <div className="grid gap-2">{missed.slice(0, 6).map(row)}</div>
        </>
      )}

      <SectionTitle>Coming up</SectionTitle>
      <div className="grid gap-4">
        {upcoming.map((d) => (
          <div key={d.date}>
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-faint">
              {new Date(d.date + "T00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
              {d.phase === "revise" && " · revision"}
              {d.phase === "rest" && " · rest"}
            </div>
            <div className="grid gap-2">{d.tasks.map(row)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

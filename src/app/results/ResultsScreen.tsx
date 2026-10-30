"use client";

import { motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  CircleCheck,
  CircleMinus,
  CircleX,
  Clock,
  Flag,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useBank } from "@/lib/bank";
import { fmtDuration, pct } from "@/lib/format";
import { schemeById, scoreAttempt } from "@/lib/scoring";
import { useApp, useHydrated } from "@/lib/store";
import { revisionTest } from "@/lib/tests";
import type { Attempt } from "@/lib/types";
import { Confetti } from "@/components/Confetti";
import { CountUp } from "@/components/CountUp";
import { ProgressRing } from "@/components/ProgressRing";
import { Explanation, Options, QuestionText, type OptionState } from "@/components/QuestionView";
import { useStartTest } from "@/components/useStartTest";
import { Button, ButtonLink, Card, Chip, PageSkeleton, SectionTitle, cx } from "@/components/ui";

type Filter = "all" | "correct" | "wrong" | "skipped" | "bookmarked" | "marked";

export function ResultsScreen() {
  const id = useSearchParams().get("id");
  const hydrated = useHydrated();
  const attempts = useApp((s) => s.attempts);
  const attempt = attempts.find((a) => a.id === id);

  if (!hydrated) return <PageSkeleton />;
  if (!attempt)
    return (
      <Card className="mx-auto mt-10 max-w-md p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Result not found</h1>
        <p className="mt-2 text-muted">It may have been cleared from this device.</p>
        <ButtonLink href="/progress" className="mt-6">
          See all results
        </ButtonLink>
      </Card>
    );
  return <Result attempt={attempt} attempts={attempts} />;
}

function verdictOf(a: Attempt, i: number) {
  const r = a.responses[i];
  return r == null ? "skipped" : r === a.key[i] ? "correct" : "wrong";
}

function Result({ attempt: a, attempts }: { attempt: Attempt; attempts: Attempt[] }) {
  const { bank } = useBank();
  const bookmarks = useApp((s) => s.bookmarks);
  const installPrompt = useApp((s) => s.installPrompt);
  const { start, dialog } = useStartTest();
  const [filter, setFilter] = useState<Filter>("all");
  const score = scoreAttempt(a);
  const scheme = schemeById(a.config.schemeId);
  const n = a.config.qids.length;

  // Personal best: beats every earlier attempt of the same test. Celebrate only right after submitting.
  const earlier = attempts.filter((x) => x.config.key === a.config.key && x.finishedAt < a.finishedAt);
  const isPB = earlier.length > 0 && earlier.every((x) => scoreAttempt(x).net < score.net);
  const [fresh] = useState(() => Date.now() - a.finishedAt < 60_000);

  // A good first session unlocks the "Add to Home Screen" prompt.
  useEffect(() => {
    if (fresh && installPrompt === "pending" && score.attempted >= 5 && score.accuracy >= 0.5) {
      useApp.getState().setInstallPrompt("eligible");
    }
  }, [fresh, installPrompt, score.attempted, score.accuracy]);

  const avgMs = score.attempted ? a.qTimeMs.reduce((x, y) => x + y, 0) / n : 0;
  const targetMs = a.config.durationSec ? (a.config.durationSec * 1000) / n : 60_000;

  const byTopic = useMemo(() => {
    const m = new Map<string, { c: number; t: number }>();
    a.topics.forEach((t, i) => {
      const e = m.get(t) ?? { c: 0, t: 0 };
      e.t++;
      if (verdictOf(a, i) === "correct") e.c++;
      m.set(t, e);
    });
    return [...m.entries()].sort((x, y) => x[1].c / x[1].t - y[1].c / y[1].t);
  }, [a]);

  const idx = a.config.qids.map((_, i) => i);
  const matches = (f: Filter, i: number) =>
    f === "all" ||
    (f === "bookmarked" ? bookmarks.includes(a.config.qids[i]) : f === "marked" ? a.marked[i] : verdictOf(a, i) === f);
  const shown = idx.filter((i) => matches(filter, i));
  const mistakes = idx.filter((i) => verdictOf(a, i) !== "correct").map((i) => a.config.qids[i]);

  const ringColor = score.percent >= 0.6 ? "var(--good)" : score.percent >= 0.35 ? "var(--warn)" : "var(--bad)";

  return (
    <div>
      {dialog}
      {fresh && isPB && <Confetti />}
      <Card strong className="relative overflow-hidden p-5 sm:p-7">
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-primary/15 blur-3xl" />
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          {a.config.mode === "exam" ? "Exam result" : "Practice result"} ·{" "}
          {new Date(a.finishedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{a.config.title}</h1>
        <div className="mt-5 flex items-center gap-5">
          <ProgressRing value={Math.max(0, score.percent)} size={112} stroke={10} color={ringColor}>
            <div className="text-center">
              <div className="font-display text-2xl font-extrabold">
                <CountUp to={score.percent * 100} />%
              </div>
              <div className="text-[11px] text-muted">score</div>
            </div>
          </ProgressRing>
          <div>
            <div className="font-display text-4xl font-extrabold">
              <CountUp to={score.net} decimals={Number.isInteger(score.net) ? 0 : 2} />
              <span className="text-lg font-bold text-muted"> / {+score.max.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted">Net marks · {scheme.label}</p>
            {isPB && (
              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warn/15 px-3 py-1 text-sm font-bold text-warn"
              >
                <Trophy size={15} /> Personal best!
              </motion.p>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile icon={<Target size={18} />} tone="text-primary" label="Accuracy" value={score.attempted ? pct(score.accuracy) : "—"} />
        <Tile icon={<CircleCheck size={18} />} tone="text-good" label="Correct" value={`${score.correct}`} />
        <Tile
          icon={<CircleX size={18} />}
          tone="text-bad"
          label={scheme.wrong ? `Wrong · −${+(score.wrong * scheme.wrong).toFixed(2)}` : "Wrong"}
          value={`${score.wrong}`}
        />
        <Tile icon={<CircleMinus size={18} />} tone="text-muted" label="Skipped" value={`${score.skipped}`} />
      </div>
      <Card className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
        <span className="flex items-center gap-2">
          <Clock size={16} className="text-muted" /> Time taken <b className="tabular">{fmtDuration(a.elapsedMs)}</b>
        </span>
        <span>
          Avg per question <b className={cx("tabular", avgMs > targetMs ? "text-bad" : "text-good")}>{fmtDuration(avgMs)}</b>
          <span className="text-muted"> (target {fmtDuration(targetMs)})</span>
        </span>
        <span>
          Attempted <b className="tabular">{score.attempted}/{n}</b>
        </span>
      </Card>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {mistakes.length > 0 && (
          <Button onClick={() => start(revisionTest(mistakes, `Mistakes · ${a.config.title}`, a.config.schemeId))}>
            <Sparkles size={17} /> Practise {mistakes.length} missed
          </Button>
        )}
        <Button
          variant="soft"
          onClick={() => start({ ...a.config, qids: a.config.qids })}
        >
          <RotateCcw size={17} /> Retake test
        </Button>
        <ButtonLink variant="outline" href="/tests">
          More tests
        </ButtonLink>
      </div>

      {byTopic.length > 1 && (
        <>
          <SectionTitle>By topic</SectionTitle>
          <Card className="space-y-3 p-4">
            {byTopic.map(([t, v]) => (
              <div key={t}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t}</span>
                  <span className="tabular text-muted">
                    {v.c}/{v.t}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-hairline">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: v.c / v.t >= 0.6 ? "var(--good)" : v.c / v.t >= 0.35 ? "var(--warn)" : "var(--bad)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(v.c / v.t) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>Solutions</SectionTitle>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {(
          [
            ["all", "All"],
            ["correct", "Correct"],
            ["wrong", "Wrong"],
            ["skipped", "Unattempted"],
            ["marked", "Marked"],
            ["bookmarked", "Bookmarked"],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <Chip key={f} on={filter === f} onClick={() => setFilter(f)}>
            {label} <span className="ml-1 opacity-70 tabular">{idx.filter((i) => matches(f, i)).length}</span>
          </Chip>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {!bank && <div className="skeleton h-64 rounded-3xl" />}
        {bank &&
          shown.map((i) => {
            const qid = a.config.qids[i];
            const q = bank.byId.get(qid);
            if (!q) return null;
            const v = verdictOf(a, i);
            const r = a.responses[i];
            // Grade against the key captured at submit time.
            const key = a.key[i];
            const stateOf = (o: number): OptionState => (o === key ? "correct" : o === r ? "wrong" : "dim");
            const marked = bookmarks.includes(qid);
            return (
              <Card key={qid} className="p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-display font-bold">Q{i + 1}</span>
                  <span
                    className={cx(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      v === "correct" && "bg-good-soft text-good",
                      v === "wrong" && "bg-bad-soft text-bad",
                      v === "skipped" && "bg-hairline text-muted",
                    )}
                  >
                    {v === "correct" ? "Correct" : v === "wrong" ? "Wrong" : "Unattempted"}
                  </span>
                  {a.marked[i] && <Flag size={14} className="text-st-marked" aria-label="Marked for review" />}
                  <span className="text-xs tabular text-muted">{fmtDuration(a.qTimeMs[i])}</span>
                  <button
                    onClick={() => useApp.getState().toggleBookmark(qid)}
                    className={cx("ml-auto grid size-9 place-items-center rounded-xl hover:bg-hairline", marked ? "text-primary" : "text-muted")}
                    aria-pressed={marked}
                    aria-label={marked ? "Remove bookmark" : "Bookmark question"}
                  >
                    {marked ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
                  </button>
                </div>
                <QuestionText text={q.question} className="!text-base" />
                <div className="mt-3">
                  <Options q={q} stateOf={stateOf} disabled />
                </div>
                <div className="mt-3">
                  <Explanation q={q} />
                </div>
              </Card>
            );
          })}
        {bank && !shown.length && <p className="py-8 text-center text-muted">Nothing here.</p>}
      </div>
      <p className="mt-8 text-center text-sm">
        <Link href="/progress" className="font-semibold text-primary">
          See your overall progress →
        </Link>
      </p>
    </div>
  );
}

function Tile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <Card className="p-4">
      <div className={tone}>{icon}</div>
      <div className="mt-2 font-display text-2xl font-bold tabular">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </Card>
  );
}

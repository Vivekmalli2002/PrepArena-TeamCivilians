"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  ChevronRight,
  Flame,
  GraduationCap,
  Layers,
  Play,
  RotateCcw,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { examById } from "@/content/catalog";
import { useExamBank } from "@/lib/useExamBank";
import { fmtClock, pct } from "@/lib/format";
import { dayKey } from "@/lib/random";
import { scoreAttempt } from "@/lib/scoring";
import { isDue } from "@/lib/srs";
import { currentStreak, useApp, useHydrated, useSession } from "@/lib/store";
import { dailyQuiz, fullMock, FULL_MOCK, topicSets, topicSetTest } from "@/lib/tests";
import { ExamPicker } from "@/components/ExamPicker";
import { PapersSection } from "@/components/PapersSection";
import { Onboarding } from "@/components/Onboarding";
import { ProgressRing } from "@/components/ProgressRing";
import { useStartTest } from "@/components/useStartTest";
import { Button, ButtonLink, Card, PageSkeleton, SectionTitle, Sheet, enter } from "@/components/ui";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function HomeScreen() {
  const hydrated = useHydrated();
  const profile = useApp((s) => s.profile);
  if (!hydrated) return <PageSkeleton />;
  if (!profile) return <Onboarding />;
  return <Dashboard />;
}

function Dashboard() {
  const { bank, fullBank } = useExamBank();
  const profile = useApp((s) => s.profile)!;
  const attempts = useApp((s) => s.attempts);
  const qstats = useApp((s) => s.qstats);
  const activeDays = useApp((s) => s.activeDays);
  const session = useSession((s) => s.session);
  const { start, dialog } = useStartTest();
  const [examOpen, setExamOpen] = useState(false);

  const exam = examById(profile.examId);
  const schemeId = exam?.schemeId ?? "appsc";
  const today = dayKey();
  const dailyDone = attempts.find((a) => a.config.key === `daily:${today}`);
  const streak = currentStreak(activeDays);

  const stats = useMemo(() => {
    const seen = Object.keys(qstats).length;
    let n = 0;
    let c = 0;
    for (const s of Object.values(qstats)) {
      n += s.n;
      c += s.c;
    }
    return { seen, accuracy: n ? c / n : 0, tests: attempts.length };
  }, [qstats, attempts.length]);

  /** Next set in the topic the student last worked on. */
  const nextUp = useMemo(() => {
    if (!bank) return null;
    const last = [...attempts].reverse().find((a) => a.config.topic);
    const topic = bank.topics.find((t) => t.name === last?.config.topic) ?? bank.topics[0];
    const sets = topicSets(topic.qids);
    const idx = sets.findIndex((s) => s.some((id) => !qstats[id]));
    const i = idx === -1 ? 0 : idx;
    return { topic, i, set: sets[i], total: sets.length };
  }, [bank, attempts, qstats]);

  const [now] = useState(() => Date.now());
  const dueCount = useMemo(() => Object.values(qstats).filter((s) => isDue(s, now)).length, [qstats, now]);

  const inProgress = session?.started ? session : null;
  const answered = inProgress?.responses.filter((r) => r != null).length ?? 0;

  return (
    <motion.div variants={enter.container} initial="hidden" animate="show">
      {dialog}
      <motion.div variants={enter.item} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{greeting()}</p>
          <h1 className="font-display text-[28px] font-extrabold leading-tight sm:text-4xl">
            {profile.name ? profile.name : "Aspirant"}
          </h1>
        </div>
        <button
          onClick={() => setExamOpen(true)}
          className="glass flex h-10 items-center gap-2 rounded-full pl-3 pr-2 text-sm font-semibold"
          aria-label={`Target exam: ${exam?.name}. Change`}
        >
          <GraduationCap size={17} className="text-primary" />
          {exam?.short}
          <ChevronRight size={16} className="text-muted" />
        </button>
      </motion.div>

      {/* Continue */}
      <motion.div variants={enter.item} className="mt-5">
        {inProgress ? (
          <Card strong className="relative overflow-hidden p-5">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/15 blur-2xl" />
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Continue where you left off</p>
            <h2 className="mt-1 font-display text-xl font-bold">{inProgress.config.title}</h2>
            <p className="mt-1 text-sm text-muted">
              {answered}/{inProgress.config.qids.length} answered · {fmtClock(inProgress.elapsedMs)} spent ·{" "}
              {inProgress.config.mode === "exam" ? "Exam mode" : "Practice mode"}
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: pct(answered / inProgress.config.qids.length) }}
              />
            </div>
            <ButtonLink href="/play" className="mt-4 w-full sm:w-auto">
              <Play size={18} /> Resume test
            </ButtonLink>
          </Card>
        ) : nextUp ? (
          <Card strong className="relative overflow-hidden p-5">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/15 blur-2xl" />
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              {attempts.length ? "Up next" : "Start here"}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">
              {nextUp.topic.name} · Set {nextUp.i + 1}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {nextUp.set.length} questions · practice mode · set {nextUp.i + 1} of {nextUp.total}
            </p>
            <Button
              className="mt-4 w-full sm:w-auto"
              onClick={() => start(topicSetTest(nextUp.topic.name, nextUp.i, nextUp.set, "practice", schemeId))}
            >
              <Play size={18} /> Start practising
            </Button>
          </Card>
        ) : (
          <div className="skeleton h-40 rounded-3xl" />
        )}
      </motion.div>

      {/* Daily + Mock */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <motion.div variants={enter.item}>
          <Card className="flex h-full items-center gap-4 p-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <CalendarCheck size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold">Daily Quiz</h3>
              <p className="text-sm text-muted">
                {dailyDone
                  ? `Done · ${scoreAttempt(dailyDone).correct}/${dailyDone.config.qids.length} correct`
                  : "10 fresh questions · same for everyone today"}
              </p>
            </div>
            {dailyDone ? (
              <ButtonLink variant="soft" size="sm" href={`/results?id=${dailyDone.id}`}>
                Review
              </ButtonLink>
            ) : (
              <Button size="sm" disabled={!bank} onClick={() => bank && start(dailyQuiz(bank, today, schemeId))}>
                Start
              </Button>
            )}
          </Card>
        </motion.div>
        <motion.div variants={enter.item}>
          <Card className="flex h-full items-center gap-4 p-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Timer size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold">Full Mock</h3>
              <p className="text-sm text-muted">
                {FULL_MOCK.count} Q · {FULL_MOCK.minutes} min · real CBT console
              </p>
            </div>
            <Button size="sm" variant="soft" disabled={!bank} onClick={() => bank && start(fullMock(bank, schemeId, undefined, undefined, qstats))}>
              Start
            </Button>
          </Card>
        </motion.div>
      </div>

      {dueCount > 0 && (
        <motion.div variants={enter.item} className="mt-3">
          <Link href="/learn">
            <Card className="flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-bad-soft text-bad">
                <RotateCcw size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-bold">{dueCount} due for revision</h3>
                <p className="text-sm text-muted">Questions you missed, back on schedule — a few minutes now saves marks later.</p>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </Card>
          </Link>
        </motion.div>
      )}

      {/* Quick stats */}
      <SectionTitle
        action={
          <Link href="/progress" className="flex items-center gap-1 text-sm font-semibold text-primary">
            Details <ArrowRight size={15} />
          </Link>
        }
      >
        Your progress
      </SectionTitle>
      <motion.div variants={enter.item} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Flame size={18} />} tone="text-orange-500" label="Day streak" value={String(streak)} />
        <Stat icon={<Trophy size={18} />} tone="text-primary" label="Tests taken" value={String(stats.tests)} />
        <Stat
          icon={<Target size={18} />}
          tone="text-good"
          label="Accuracy"
          value={stats.tests ? pct(stats.accuracy) : "—"}
        />
        <Card className="flex items-center gap-3 p-4">
          <ProgressRing value={bank ? stats.seen / bank.total : 0} size={44} stroke={5}>
            <Layers size={15} className="text-primary" />
          </ProgressRing>
          <div>
            <div className="font-display text-xl font-bold tabular">{stats.seen}</div>
            <div className="text-xs text-muted">of {bank?.total ?? "…"} practised</div>
          </div>
        </Card>
      </motion.div>

      {/* Papers for this exam */}
      <SectionTitle
        action={
          <Link href={`/exams/${profile.examId}`} className="flex items-center gap-1 text-sm font-semibold text-primary">
            Notification <ArrowRight size={15} />
          </Link>
        }
      >
        Your papers · {exam?.short}
      </SectionTitle>
      <motion.div variants={enter.item}>
        <PapersSection examId={profile.examId} counts={fullBank ? Object.fromEntries(fullBank.subjects.map((s) => [s.id, s.total])) : {}} />
      </motion.div>

      <Sheet open={examOpen} onClose={() => setExamOpen(false)} title="Target exam">
        <ExamPicker
          value={profile.examId}
          onChange={(examId) => {
            useApp.getState().setProfile({ ...profile, examId });
            setExamOpen(false);
          }}
        />
      </Sheet>
    </motion.div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <Card className="p-4">
      <div className={tone}>{icon}</div>
      <div className="mt-2 font-display text-2xl font-bold tabular">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </Card>
  );
}

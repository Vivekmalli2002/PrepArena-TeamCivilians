"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, Flame, Layers, Target, Trophy, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { examById } from "@/content/catalog";
import { MIN_FOR_WEAK, timeManagement, topicMastery, trend, weakAreas } from "@/lib/analytics";
import { useBank } from "@/lib/bank";
import { fmtDuration, pct } from "@/lib/format";
import { dayKey } from "@/lib/random";
import { scoreAttempt } from "@/lib/scoring";
import { currentStreak, useApp, useHydrated, useSession } from "@/lib/store";
import { weakAreaTest } from "@/lib/tests";
import { useStartTest } from "@/components/useStartTest";
import { Button, ButtonLink, Card, PageSkeleton, SectionTitle, Sheet, Skeleton, cx, enter } from "@/components/ui";

const TrendChart = dynamic(() => import("./TrendChart"), { ssr: false, loading: () => <Skeleton className="h-56" /> });

export function ProgressScreen() {
  const hydrated = useHydrated();
  const { bank } = useBank();
  const attempts = useApp((s) => s.attempts);
  const qstats = useApp((s) => s.qstats);
  const activeDays = useApp((s) => s.activeDays);
  const examId = useApp((s) => s.profile?.examId);
  const schemeId = examById(examId)?.schemeId ?? "appsc";
  const { start, dialog } = useStartTest();
  const [resetOpen, setResetOpen] = useState(false);
  const router = useRouter();

  const mastery = useMemo(() => (bank ? topicMastery(bank, qstats) : []), [bank, qstats]);
  const weak = useMemo(() => weakAreas(mastery), [mastery]);
  const series = useMemo(() => trend(attempts), [attempts]);
  const time = useMemo(() => timeManagement(attempts), [attempts]);

  if (!hydrated || !bank) return <PageSkeleton />;

  const seen = Object.keys(qstats).length;
  let n = 0;
  let c = 0;
  for (const s of Object.values(qstats)) {
    n += s.n;
    c += s.c;
  }
  const streak = currentStreak(activeDays);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 13 + i);
    return { key: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: "narrow" }), on: activeDays.includes(dayKey(d)) };
  });

  if (!attempts.length)
    return (
      <div>
        <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Progress</h1>
        <Card className="mt-6 p-8 text-center">
          <Trophy size={36} className="mx-auto text-primary" />
          <h2 className="mt-3 font-display text-xl font-bold">Your coaching report starts here</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Finish a test and we&apos;ll map your mastery by topic, spot weak areas and track your speed.
          </p>
          <ButtonLink href="/tests" className="mt-6">
            Take a test
          </ButtonLink>
        </Card>
      </div>
    );

  // Topics with no data yet are a useful nudge when there aren't enough answers for "weak areas".
  const untouched = mastery.filter((m) => m.accuracy == null).sort((a, b) => b.total - a.total);

  return (
    <motion.div variants={enter.container} initial="hidden" animate="show">
      {dialog}
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Progress</h1>
      <p className="mt-1 text-sm text-muted">What to study next, based on every test you&apos;ve taken.</p>

      <motion.div variants={enter.item} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile icon={<Trophy size={18} />} tone="text-primary" label="Tests taken" value={String(attempts.length)} />
        <Tile icon={<Target size={18} />} tone="text-good" label="Overall accuracy" value={n ? pct(c / n) : "—"} />
        <Tile
          icon={<Layers size={18} />}
          tone="text-primary"
          label={`of ${bank.questions.length} practised`}
          value={String(seen)}
        />
        <Tile icon={<Flame size={18} />} tone="text-orange-500" label="Day streak" value={String(streak)} />
      </motion.div>

      <motion.div variants={enter.item}>
        <Card className="mt-3 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Last 14 days</span>
            <span className="text-muted">{days.filter((d) => d.on).length} active</span>
          </div>
          <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
            {days.map((d) => (
              <div key={d.key} className="text-center">
                <div
                  title={`${d.key}${d.on ? " · practised" : ""}`}
                  className={cx("h-7 rounded-md", d.on ? "bg-orange-500" : "bg-hairline")}
                />
                <div className="mt-1 text-[10px] text-faint">{d.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Weak areas */}
      <SectionTitle>Focus next</SectionTitle>
      <motion.div variants={enter.item} className="grid gap-3 sm:grid-cols-3">
        {weak.length ? (
          weak.map((w, i) => (
            <Card key={w.topic} strong={i === 0} className="flex flex-col p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-bad">#{i + 1} weakest</p>
              <h3 className="mt-1 font-semibold leading-snug">{w.topic}</h3>
              <p className="mt-1 text-sm text-muted">
                {pct(w.accuracy!)} accuracy · {w.answered} answered
              </p>
              <Button
                size="sm"
                className="mt-3 self-start"
                onClick={() => start(weakAreaTest(bank, w.topic, qstats, schemeId))}
              >
                <Zap size={15} /> Practise this
              </Button>
            </Card>
          ))
        ) : (
          <Card className="p-4 sm:col-span-3">
            <p className="text-sm text-muted">
              Answer at least {MIN_FOR_WEAK} questions in a topic to rank your weak areas. Meanwhile, start a topic you
              haven&apos;t touched:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {untouched.slice(0, 3).map((u) => (
                <Button key={u.topic} size="sm" variant="soft" onClick={() => start(weakAreaTest(bank, u.topic, qstats, schemeId))}>
                  {u.topic}
                </Button>
              ))}
            </div>
          </Card>
        )}
      </motion.div>

      {/* Mastery map */}
      <SectionTitle>Topic mastery</SectionTitle>
      <motion.div variants={enter.item}>
        <Card className="p-4 sm:p-5">
          <ul className="space-y-3.5">
            {[...mastery]
              .sort((a, b) => (b.accuracy ?? -1) - (a.accuracy ?? -1))
              .map((m) => (
                <li key={m.topic}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{m.topic}</span>
                    <span className="shrink-0 tabular">
                      {m.accuracy == null ? (
                        <span className="text-faint">Not started</span>
                      ) : (
                        <>
                          <b>{pct(m.accuracy)}</b>
                          <span className="text-muted"> · {m.seen}/{m.total} seen</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-hairline">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.accuracy ?? 0) * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </Card>
      </motion.div>

      {/* Trend */}
      <SectionTitle>Score trend</SectionTitle>
      <motion.div variants={enter.item}>
        <Card className="p-4">
          <p className="mb-2 text-sm text-muted">Net score % (after negative marking) · last {series.length} tests</p>
          {series.length >= 2 ? (
            <TrendChart data={series} />
          ) : (
            <p className="py-10 text-center text-sm text-muted">Take one more test to see your trend.</p>
          )}
        </Card>
      </motion.div>

      {/* Time management */}
      <SectionTitle>Time management</SectionTitle>
      <motion.div variants={enter.item}>
        <Card className="p-4">
          {time ? (
            <>
              <div className="flex items-baseline gap-2">
                <Clock size={18} className="self-center text-muted" />
                <span className="font-display text-2xl font-bold tabular">{fmtDuration(time.avgMs)}</span>
                <span className="text-sm text-muted">per question vs {fmtDuration(time.targetMs)} allowed</span>
              </div>
              <div className="relative mt-3 h-2 rounded-full bg-hairline">
                <div
                  className={cx("h-full rounded-full", time.avgMs > time.targetMs ? "bg-bad" : "bg-good")}
                  style={{ width: `${Math.min(100, (time.avgMs / time.targetMs) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-muted">
                {time.avgMs > time.targetMs
                  ? "You're running over the clock — skip and come back to long statement questions."
                  : `On pace — ${fmtDuration(time.targetMs - time.avgMs)} spare per question on average.`}{" "}
                Based on your last {time.tests} timed exam{time.tests > 1 ? "s" : ""}.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">Take a timed mock in exam mode to see your pace.</p>
          )}
        </Card>
      </motion.div>

      {/* History */}
      <SectionTitle>Recent tests</SectionTitle>
      <motion.div variants={enter.item}>
        <Card className="divide-y divide-[var(--hairline)] p-1">
          {[...attempts]
            .reverse()
            .slice(0, 12)
            .map((a) => {
              const s = scoreAttempt(a);
              return (
                <Link key={a.id} href={`/results?id=${a.id}`} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-hairline">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{a.config.title}</div>
                    <div className="text-xs text-muted">
                      {new Date(a.finishedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })} ·{" "}
                      {a.config.mode} · {s.correct}/{s.total} correct
                    </div>
                  </div>
                  <span className="font-display font-bold tabular">{pct(s.percent)}</span>
                  <ArrowRight size={16} className="text-muted" />
                </Link>
              );
            })}
        </Card>
      </motion.div>

      <div className="mt-10 text-center">
        <button onClick={() => setResetOpen(true)} className="text-sm font-semibold text-muted hover:text-bad">
          Reset all progress on this device
        </button>
      </div>
      <Sheet open={resetOpen} onClose={() => setResetOpen(false)} title="Reset all progress?">
        <p className="text-muted">
          This deletes your profile, every result, bookmarks and streak from this device. It can&apos;t be undone.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              useSession.getState().discard();
              useApp.getState().resetAll();
              setResetOpen(false);
              router.push("/");
            }}
          >
            Reset
          </Button>
        </div>
      </Sheet>
    </motion.div>
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

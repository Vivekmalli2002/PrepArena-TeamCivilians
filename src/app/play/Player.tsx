"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Flag,
  Grid3x3,
  Info,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  Send,
  Timer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuestions } from "@/lib/bank";
import { fmtClock } from "@/lib/format";
import { optionOrder } from "@/lib/random";
import { SCHEMES, schemeById } from "@/lib/scoring";
import { paletteStatus, useApp, useHydrated, useSession } from "@/lib/store";
import type { PaletteStatus, Question, Session } from "@/lib/types";
import { Explanation, Options, QuestionText, type OptionState } from "@/components/QuestionView";
import { Button, ButtonLink, Card, Chip, PageSkeleton, Segmented, Sheet, cx } from "@/components/ui";
import { OmrConsole } from "./OmrConsole";

export function Player() {
  const hydrated = useHydrated();
  const session = useSession((s) => s.session);
  const { byId, error } = useQuestions(session?.config.qids ?? null);

  if (!hydrated) return <Frame><PageSkeleton /></Frame>;
  if (!session)
    return (
      <Frame>
        <Card className="mx-auto mt-16 max-w-md p-8 text-center">
          <h1 className="font-display text-2xl font-bold">No test in progress</h1>
          <p className="mt-2 text-muted">Pick a topic set, mock or the daily quiz to begin.</p>
          <ButtonLink href="/tests" className="mt-6">
            Browse tests
          </ButtonLink>
        </Card>
      </Frame>
    );
  if (error) return <Frame><p className="text-bad">{error}</p></Frame>;
  if (!session.started) return <Instructions session={session} />;
  if (!byId) return <Frame><PageSkeleton /></Frame>;
  if (session.config.omr) return <OmrConsole session={session} byId={byId} />;
  return <Console session={session} byId={byId} />;
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-dvh max-w-3xl px-4 py-6">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Instructions — the "read before you begin" screen of the real CBT. */

const STATUS_META: Record<PaletteStatus, { label: string; cls: string }> = {
  notVisited: { label: "Not visited", cls: "bg-st-notvisited text-st-notvisited-fg rounded-lg" },
  notAnswered: { label: "Not answered", cls: "bg-st-notanswered text-white rounded-b-xl rounded-t-md" },
  answered: { label: "Answered", cls: "bg-st-answered text-white rounded-t-xl rounded-b-md" },
  marked: { label: "Marked for review", cls: "bg-st-marked text-white rounded-full" },
  answeredMarked: { label: "Answered & marked (will be evaluated)", cls: "bg-st-marked text-white rounded-full" },
};

function StatusSwatch({ status, children }: { status: PaletteStatus; children?: React.ReactNode }) {
  return (
    <span className={cx("relative grid size-9 shrink-0 place-items-center text-sm font-bold tabular", STATUS_META[status].cls)}>
      {children}
      {status === "answeredMarked" && (
        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[var(--glass-strong)] bg-st-answered" />
      )}
    </span>
  );
}

function Instructions({ session }: { session: Session }) {
  const router = useRouter();
  const cfg = session.config;
  const [mode, setMode] = useState(cfg.mode);
  const [schemeId, setSchemeId] = useState(cfg.schemeId);
  const [omr, setOmr] = useState(!!cfg.omr);
  const scheme = schemeById(schemeId);
  const n = cfg.qids.length;
  const timed = cfg.durationSec > 0 && mode === "exam";

  return (
    <Frame>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm font-semibold text-muted hover:text-fg"
        >
          <ChevronLeft size={18} /> Back
        </button>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Instructions</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight">{cfg.title}</h1>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { k: "Questions", v: n },
            { k: "Duration", v: timed ? `${Math.round(cfg.durationSec / 60)} min` : "Self-paced" },
            { k: "Max marks", v: +(n * scheme.correct).toFixed(2) },
          ].map((x) => (
            <Card key={x.k} className="p-3 text-center">
              <div className="font-display text-xl font-bold tabular">{x.v}</div>
              <div className="text-xs text-muted">{x.k}</div>
            </Card>
          ))}
        </div>

        <Card className="mt-4 space-y-5 p-5">
          <div>
            <p className="mb-2 text-sm font-bold">Mode</p>
            <Segmented
              label="Mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: "exam", label: "Exam" },
                { value: "practice", label: "Practice" },
              ]}
            />
            <p className="mt-2 text-sm text-muted">
              {mode === "exam"
                ? "Like the real CBT: no feedback until you submit. Your choice counts only after Save & Next."
                : "See right / wrong and the explanation the moment you tap an option."}
            </p>
          </div>
          {mode === "exam" && (
            <div>
              <p className="mb-2 text-sm font-bold">Answer on</p>
              <Segmented
                label="Answer style"
                value={omr ? "omr" : "cbt"}
                onChange={(v) => setOmr(v === "omr")}
                options={[
                  { value: "cbt", label: "CBT screen" },
                  { value: "omr", label: "OMR sheet" },
                ]}
              />
              <p className="mt-2 text-sm text-muted">
                {omr
                  ? "The whole paper on one page and a bubble sheet to fill, like a pen-and-paper exam. Questions keep a fixed option order."
                  : "One question at a time with a palette, like the online exam."}
              </p>
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-bold">Marking</p>
            <div className="flex flex-wrap gap-2">
              {SCHEMES.map((s) => (
                <Chip key={s.id} on={s.id === schemeId} onClick={() => setSchemeId(s.id)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>
        </Card>

        <Card className="mt-4 p-5">
          <p className="mb-3 text-sm font-bold">Question palette</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(Object.keys(STATUS_META) as PaletteStatus[]).map((s, i) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <StatusSwatch status={s}>{i + 1}</StatusSwatch>
                {STATUS_META[s].label}
              </div>
            ))}
          </div>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>
              Each correct answer: <b className="text-fg">+{+scheme.correct.toFixed(2)}</b>
              {scheme.wrong ? (
                <>
                  , each wrong answer: <b className="text-fg">−{+scheme.wrong.toFixed(2)}</b>
                </>
              ) : (
                ", no negative marking"
              )}
              . Unanswered: 0.
            </li>
            {timed && <li>The test submits automatically when the clock reaches 00:00.</li>}
            <li>You can pause, and your progress is saved on this device if you close the app.</li>
          </ul>
        </Card>

        <Button size="lg" className="mt-6 w-full" onClick={() => useSession.getState().begin({ mode, schemeId, omr: mode === "exam" && omr })}>
          I&apos;m ready — begin <ChevronRight size={18} />
        </Button>
      </motion.div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* The exam console. */

function Console({ session, byId }: { session: Session; byId: Map<number, Question> }) {
  const router = useRouter();
  const S = useSession.getState;
  const bookmarks = useApp((s) => s.bookmarks);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);

  const cfg = session.config;
  const n = cfg.qids.length;
  const i = session.current;
  const q = byId.get(cfg.qids[i])!;
  // Options are shuffled for display only; answers and scoring use the original option index.
  const order = optionOrder(q.options, `${session.id}:${q.id}`);
  const orderKey = order.join(",");
  const practice = cfg.mode === "practice";
  // Practice is self-paced (count-up clock); only exam mode counts down and auto-submits.
  const timed = cfg.durationSec > 0 && !practice;
  const limitMs = cfg.durationSec * 1000;
  const remaining = limitMs - session.elapsedMs;
  const perQTarget = timed ? limitMs / n : 60_000;
  const qMs = session.qTimeMs[i];
  const bookmarked = bookmarks.includes(q.id);

  const finish = () => {
    const id = S().submit(byId);
    if (id) router.replace(`/results?id=${id}`);
  };

  // Each question starts at the top, like turning a page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [i]);

  // Clock: real elapsed time between ticks, so a slow tab never drifts.
  const last = useRef<number>(0);
  useEffect(() => {
    last.current = performance.now();
    const t = setInterval(() => {
      const now = performance.now();
      S().tick(now - last.current);
      last.current = now;
    }, 1000);
    return () => clearInterval(t);
  }, [S]);

  // Auto-submit when an exam-mode clock runs out.
  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (timed && remaining <= 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      finish();
    }
  });

  // Desktop keyboard shortcuts.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (session.paused || paletteOpen || submitOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const idx = "abcde".indexOf(key) >= 0 ? "abcde".indexOf(key) : "12345".indexOf(key);
      if (idx >= 0 && idx < q.options.length) S().choose(order[idx] ?? idx);
      else if (e.key === "ArrowRight") {
        if (practice) S().goTo(i + 1);
        else S().saveNext();
      }
      else if (e.key === "ArrowLeft") S().goTo(i - 1);
      else if (key === "m") S().markNext();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S, i, q.options.length, orderKey, practice, session.paused, paletteOpen, submitOpen]);

  const chosen = practice ? session.responses[i] : session.drafts[i];
  const revealed = practice && session.responses[i] != null;
  const stateOf = (o: number): OptionState => {
    if (revealed) {
      if (o === q.answerIndex) return "correct";
      if (o === chosen) return "wrong";
      return "dim";
    }
    return o === chosen ? "selected" : "idle";
  };

  const counts = useMemo(() => {
    const c: Record<PaletteStatus, number> = { notVisited: 0, notAnswered: 0, answered: 0, marked: 0, answeredMarked: 0 };
    for (let j = 0; j < n; j++) c[paletteStatus(session, j)]++;
    return c;
  }, [session, n]);

  const palette = (
    <Palette
      session={session}
      counts={counts}
      onJump={(j) => {
        S().goTo(j);
        setPaletteOpen(false);
      }}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[linear-gradient(to_bottom,var(--bg)_75%,transparent)] px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5">
        <div className="glass-solid mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-2xl px-2">
          <button
            onClick={() => S().setPaused(true)}
            className="grid size-10 place-items-center rounded-xl hover:bg-hairline"
            aria-label="Pause test"
          >
            <Pause size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold leading-tight">{cfg.title}</div>
            <div className="truncate text-xs text-muted">
              {practice ? "Practice" : "Exam"}
              <span className="max-sm:hidden"> · {schemeById(cfg.schemeId).label}</span>
            </div>
          </div>
          <div
            className={cx(
              "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-display text-lg font-bold tabular",
              timed && remaining < 60_000 ? "bg-bad-soft text-bad" : timed && remaining < limitMs * 0.1 ? "text-warn" : "",
            )}
            role="timer"
            aria-label={timed ? "Time left" : "Time elapsed"}
          >
            <Clock size={17} className="opacity-70" />
            {timed ? fmtClock(remaining) : fmtClock(session.elapsedMs)}
          </div>
          <button
            onClick={() => setPaletteOpen(true)}
            className="grid size-10 place-items-center rounded-xl hover:bg-hairline lg:hidden"
            aria-label="Question palette"
          >
            <Grid3x3 size={20} />
          </button>
          <Button size="sm" className="max-lg:hidden" onClick={() => setSubmitOpen(true)}>
            Submit
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-5 px-3 pb-40 pt-4 sm:px-5 lg:pb-8">
        <main className="min-w-0 flex-1">
          {/* Question meta */}
          <div className="mb-3 flex items-center gap-2">
            <span className="font-display text-lg font-bold">
              Q{i + 1}
              <span className="text-sm font-semibold text-muted"> / {n}</span>
            </span>
            <span
              className={cx(
                "ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular",
                qMs > perQTarget ? "bg-bad-soft text-bad" : "bg-hairline text-muted",
              )}
              title="Time on this question"
            >
              <Timer size={13} /> {fmtClock(qMs)}
            </span>
            <span className="hidden truncate text-xs text-muted sm:inline">{q.topic}</span>
            <button
              onClick={() => useApp.getState().toggleBookmark(q.id)}
              className={cx(
                "ml-auto grid size-10 place-items-center rounded-xl hover:bg-hairline",
                bookmarked ? "text-primary" : "text-muted",
              )}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
            >
              {bookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
          </div>
          {/* Progress */}
          <div className="mb-4 h-1 overflow-hidden rounded-full bg-hairline">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${((counts.answered + counts.answeredMarked) / n) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              <Card strong className="p-4 sm:p-6">
                <QuestionText text={q.question} />
                {q.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.image} alt="Figure for the question" className="mt-3 max-h-96 w-full rounded-xl border border-hairline bg-white object-contain" />
                )}
              </Card>
              <div className="mt-4">
                <Options q={q} order={order} stateOf={stateOf} onChoose={(o) => S().choose(o)} disabled={revealed} />
              </div>
              {revealed && (
                <div className="mt-4">
                  <Explanation q={q} verdict={chosen === q.answerIndex ? "correct" : "wrong"} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <aside className="hidden w-[300px] shrink-0 lg:block">
          <Card className="sticky top-24 p-4">{palette}</Card>
        </aside>
      </div>

      {/* Action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-[linear-gradient(to_top,var(--bg)_60%,transparent)] px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 lg:static lg:bg-none lg:pb-6">
        <div className="glass-solid mx-auto max-w-6xl rounded-[22px] p-2">
          {practice ? (
            <div className="grid grid-cols-[auto_1fr_auto] gap-2">
              <Button variant="outline" onClick={() => S().goTo(i - 1)} disabled={i === 0} aria-label="Previous">
                <ChevronLeft size={18} />
              </Button>
              {i === n - 1 ? (
                <Button onClick={() => setSubmitOpen(true)}>
                  <Send size={17} /> Finish
                </Button>
              ) : (
                <Button onClick={() => S().goTo(i + 1)}>
                  {revealed ? "Next question" : "Skip"} <ChevronRight size={18} />
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => S().markNext()}
                aria-label="Mark for review and next"
                className={session.marked[i] ? "text-st-marked" : ""}
              >
                <Flag size={17} />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button variant="outline" onClick={() => (S().markNext(), i === n - 1 && setSubmitOpen(true))} className="text-st-marked">
                <Flag size={16} /> Mark & Next
              </Button>
              <Button variant="outline" onClick={() => S().clear()} disabled={chosen == null && session.responses[i] == null}>
                <Eraser size={16} /> Clear
              </Button>
              <Button variant="outline" onClick={() => S().goTo(i - 1)} disabled={i === 0} className="max-sm:hidden">
                <ChevronLeft size={16} /> Back
              </Button>
              <Button className="max-sm:col-span-2" onClick={() => (S().saveNext(), i === n - 1 && setSubmitOpen(true))}>
                {i === n - 1 ? "Save" : "Save & Next"}
              </Button>
            </div>
          )}
        </div>
        <div className="mt-2 flex justify-center lg:hidden">
          <button onClick={() => setSubmitOpen(true)} className="text-sm font-semibold text-primary">
            Submit test
          </button>
        </div>
      </div>

      <Sheet open={paletteOpen} onClose={() => setPaletteOpen(false)} title="Question palette">
        {palette}
        <Button className="mt-4 w-full" onClick={() => (setPaletteOpen(false), setSubmitOpen(true))}>
          Submit test
        </Button>
      </Sheet>

      <Sheet open={submitOpen} onClose={() => setSubmitOpen(false)} title="Submit test?">
        <div className="grid grid-cols-2 gap-2.5">
          {(Object.keys(STATUS_META) as PaletteStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-2.5 rounded-2xl bg-hairline p-2.5 text-sm">
              <StatusSwatch status={s}>{counts[s]}</StatusSwatch>
              <span className="leading-tight">{STATUS_META[s].label.replace(" (will be evaluated)", "")}</span>
            </div>
          ))}
        </div>
        {!practice && session.drafts[i] != null && session.drafts[i] !== session.responses[i] && (
          <p className="mt-3 flex gap-2 rounded-2xl bg-warn/10 p-3 text-sm">
            <Info size={18} className="shrink-0 text-warn" /> Your choice on Q{i + 1} isn&apos;t saved yet — tap Save
            first, or it won&apos;t be evaluated.
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setSubmitOpen(false)}>
            Keep going
          </Button>
          <Button onClick={finish}>Submit</Button>
        </div>
      </Sheet>

      {/* Pause overlay hides the question, like the real console. */}
      <AnimatePresence>
        {session.paused && (
          <motion.div
            className="fixed inset-0 z-40 grid place-items-center bg-[var(--bg)]/70 p-6 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card strong className="w-full max-w-sm p-6 text-center">
              <h2 className="font-display text-2xl font-bold">Paused</h2>
              <p className="mt-1 text-muted">
                {timed ? `${fmtClock(remaining)} left` : `${fmtClock(session.elapsedMs)} elapsed`} · Q{i + 1} of {n}
              </p>
              <div className="mt-6 grid gap-2.5">
                <Button size="lg" onClick={() => S().setPaused(false)}>
                  <Play size={18} /> Resume
                </Button>
                <Button variant="outline" onClick={() => setRestartOpen(true)}>
                  <RotateCcw size={17} /> Restart test
                </Button>
                <Button variant="ghost" onClick={() => router.push("/")}>
                  <LogOut size={17} /> Save & exit
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={restartOpen} onClose={() => setRestartOpen(false)} title="Restart this test?">
        <p className="text-muted">All answers and both timers will be reset to zero.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setRestartOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => (S().restart(), setRestartOpen(false))}>
            Restart
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Palette({
  session,
  counts,
  onJump,
}: {
  session: Session;
  counts: Record<PaletteStatus, number>;
  onJump: (i: number) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {(Object.keys(STATUS_META) as PaletteStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className="scale-[0.8]">
              <StatusSwatch status={s}>{counts[s]}</StatusSwatch>
            </span>
            <span className="leading-tight text-muted">{STATUS_META[s].label.replace(" (will be evaluated)", "")}</span>
          </div>
        ))}
      </div>
      <div className="no-scrollbar mt-4 grid max-h-[45dvh] grid-cols-6 gap-2 overflow-y-auto p-0.5 sm:grid-cols-7 lg:grid-cols-5">
        {session.config.qids.map((_, j) => (
          <button
            key={j}
            onClick={() => onJump(j)}
            aria-label={`Question ${j + 1}: ${STATUS_META[paletteStatus(session, j)].label}`}
            aria-current={j === session.current ? "step" : undefined}
            className={cx("grid place-items-center", j === session.current && "rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-[var(--bg)]")}
          >
            <StatusSwatch status={paletteStatus(session, j)}>{j + 1}</StatusSwatch>
          </button>
        ))}
      </div>
    </div>
  );
}

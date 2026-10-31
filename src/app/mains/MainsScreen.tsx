"use client";

import { ArrowLeft, Pause, Play, Shuffle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import mains from "@/content/mains.json";
import { useApp, useHydrated } from "@/lib/store";
import { fmtClock } from "@/lib/format";
import { Button, Card, Chip, PageSkeleton, SectionTitle, cx } from "@/components/ui";

interface MainsQ {
  id: string;
  year: number;
  paper: string;
  no: string;
  marks: number | null;
  question: string;
  theme: string;
}
const QS = mains as MainsQ[];

/** Roughly what an examiner expects per mark in APPSC Mains: 10 marks ≈ 150–200 words in ≈ 12 minutes. */
const wordsFor = (marks: number | null) => ((marks ?? 10) <= 10 ? [150, 200] : (marks ?? 10) <= 15 ? [220, 300] : [300, 400]);
const minutesFor = (marks: number | null) => Math.round(((marks ?? 10) * 1.2) / 1);

const CHECKS = [
  "I read the demand of the question — every part is answered",
  "An introduction that sets the context in two or three lines",
  "Body in points or short paragraphs, with a heading for each dimension",
  "Facts, data, schemes or examples from India and Andhra Pradesh",
  "A diagram, flowchart or table where it helps",
  "A forward-looking, balanced conclusion",
  "Written within the word limit and time",
];

export function MainsScreen() {
  const hydrated = useHydrated();
  const saved = useApp((s) => s.mains);
  const save = useApp((s) => s.saveMains);
  const [theme, setTheme] = useState("All");
  const [year, setYear] = useState<number | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const themes = useMemo(() => ["All", ...[...new Set(QS.map((q) => q.theme))].sort()], []);
  const years = useMemo(() => [...new Set(QS.map((q) => q.year))].sort((a, b) => b - a), []);
  const list = QS.filter((q) => (theme === "All" || q.theme === theme) && (year === "All" || q.year === year));
  const open = QS.find((q) => q.id === openId) ?? null;

  if (!hydrated) return <PageSkeleton />;
  if (open) return <Writer q={open} onBack={() => setOpenId(null)} />;

  const done = QS.filter((q) => saved[q.id]?.text.trim()).length;
  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Mains answer writing</h1>
      <p className="mt-1 text-sm text-muted">
        {QS.length} real APPSC Group-I Mains questions (Paper-V, Science, Technology &amp; Environmental Issues, 2008–2025). Write
        against the clock, then check yourself against the checklist. Your answers stay on this device.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          onClick={() => {
            const pool = list.filter((q) => !saved[q.id]?.text.trim());
            const pick = (pool.length ? pool : list)[Math.floor(Math.random() * (pool.length || list.length))];
            if (pick) setOpenId(pick.id);
          }}
        >
          <Shuffle size={17} /> Random unanswered
        </Button>
        <span className="text-sm text-muted">
          {done} of {QS.length} attempted
        </span>
      </div>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {themes.map((t) => (
          <Chip key={t} on={theme === t} onClick={() => setTheme(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip on={year === "All"} onClick={() => setYear("All")}>
          All years
        </Chip>
        {years.map((y) => (
          <Chip key={y} on={year === y} onClick={() => setYear(y)}>
            {y}
          </Chip>
        ))}
      </div>
      <SectionTitle>{list.length} questions</SectionTitle>
      <div className="grid gap-3">
        {list.map((q) => {
          const s = saved[q.id];
          return (
            <button key={q.id} onClick={() => setOpenId(q.id)} className="glass rounded-2xl p-4 text-left transition hover:-translate-y-0.5">
              <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                <b className="text-fg">
                  {q.year} · Q{q.no}
                </b>
                <span>{q.theme}</span>
                {q.marks != null && <span>{q.marks} marks</span>}
                {s?.text.trim() && <span className="font-semibold text-good">attempted{s.score != null ? ` · self-score ${s.score}/10` : ""}</span>}
              </div>
              <p className="mt-1.5 line-clamp-3 leading-snug">{q.question}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Writer({ q, onBack }: { q: MainsQ; onBack: () => void }) {
  const entry = useApp((s) => s.mains[q.id]);
  const save = useApp((s) => s.saveMains);
  const [text, setText] = useState(entry?.text ?? "");
  const [checks, setChecks] = useState<boolean[]>(() => CHECKS.map(() => false));
  const [secs, setSecs] = useState(entry?.seconds ?? 0);
  const [running, setRunning] = useState(false);
  const [lo, hi] = wordsFor(q.marks);
  const target = minutesFor(q.marks) * 60;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  // autosave a moment after the last keystroke
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => save(q.id, { text, seconds: secs }), 600);
    return () => clearTimeout(t);
  }, [text, secs, q.id, save]);

  const score = Math.round((checks.filter(Boolean).length / CHECKS.length) * 10);
  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft size={18} /> All questions
      </button>
      <p className="text-xs font-bold uppercase tracking-wider text-primary">
        {q.year} · Question {q.no} · {q.theme}
        {q.marks != null && ` · ${q.marks} marks`}
      </p>
      <Card strong className="mt-2 p-5">
        <p className="text-lg leading-relaxed">{q.question}</p>
      </Card>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className={cx("font-display text-2xl font-bold tabular", secs > target && "text-bad")}>{fmtClock(secs * 1000)}</div>
        <span className="text-sm text-muted">of ~{minutesFor(q.marks)} min</span>
        <Button size="sm" variant={running ? "outline" : "soft"} onClick={() => setRunning((r) => !r)}>
          {running ? <Pause size={15} /> : <Play size={15} />} {running ? "Pause" : secs ? "Resume" : "Start timer"}
        </Button>
        <span className={cx("ml-auto text-sm tabular", words > hi ? "text-bad" : words >= lo ? "text-good" : "text-muted")}>
          {words} words · aim {lo}–{hi}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setRunning(true)}
        placeholder="Write your answer here — introduction, body in points, conclusion."
        aria-label="Your answer"
        className="mt-3 min-h-[320px] w-full rounded-2xl border border-hairline bg-transparent p-4 leading-relaxed outline-none focus:border-primary"
      />
      <SectionTitle>Check your answer</SectionTitle>
      <Card className="p-4">
        <ul className="grid gap-2">
          {CHECKS.map((c, i) => (
            <li key={c}>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" className="mt-0.5 size-4" checked={checks[i]} onChange={() => setChecks((x) => x.map((v, j) => (j === i ? !v : v)))} />
                {c}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold">
            Self-score <b className="font-display text-xl tabular">{score}</b>/10
          </span>
          <Button size="sm" onClick={() => save(q.id, { text, seconds: secs, score })}>
            Save score
          </Button>
        </div>
      </Card>
    </div>
  );
}

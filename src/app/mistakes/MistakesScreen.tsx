"use client";

import { Check, Download, RotateCcw, Search, StickyNote, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { examById } from "@/content/catalog";
import { MISTAKE_REASONS, type MistakeReason } from "@/lib/extras";
import { loadQuestions, useQuestions } from "@/lib/bank";
import { LETTERS } from "@/lib/format";
import { collectMistakes, daysAgo, isMastered, mistakeStats, mistakesToCsv, sortMistakes, type Mistake, type MistakeSort } from "@/lib/mistakes";
import { useApp, useHydrated } from "@/lib/store";
import { mistakeTest } from "@/lib/tests";
import { QuestionText } from "@/components/QuestionView";
import { useStartTest } from "@/components/useStartTest";
import { Button, Card, Chip, PageSkeleton, SectionTitle, cx } from "@/components/ui";

const PAGE = 15;
const SORTS: { id: MistakeSort; label: string }[] = [
  { id: "recent", label: "Latest first" },
  { id: "missed", label: "Most missed" },
  { id: "oldest", label: "Oldest first" },
  { id: "topic", label: "By topic" },
];
const RETRY_SIZES = [10, 25, 50];

type Extra = "all" | "repeated" | "blank";

export function MistakesScreen() {
  const hydrated = useHydrated();
  const attempts = useApp((s) => s.attempts);
  const tags = useApp((s) => s.mistakeTags);
  const notes = useApp((s) => s.mistakeNotes ?? {});
  const done = useApp((s) => s.mistakeDone ?? {});
  const setTag = useApp((s) => s.setMistakeTag);
  const setNote = useApp((s) => s.setMistakeNote);
  const toggleDone = useApp((s) => s.toggleMistakeDone);
  const examId = useApp((s) => s.profile?.examId);
  const schemeId = examById(examId)?.schemeId ?? "appsc";
  const { start, dialog } = useStartTest();
  const [filter, setFilter] = useState<MistakeReason | "all">("all");
  const [extra, setExtra] = useState<Extra>("all");
  const [topic, setTopic] = useState<string>("all");
  const [sort, setSort] = useState<MistakeSort>("recent");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"open" | "mastered">("open");
  const [retry, setRetry] = useState(25);
  const [shown, setShown] = useState(PAGE);
  const [exporting, setExporting] = useState(false);

  const everything = useMemo(() => collectMistakes(attempts), [attempts]);
  const all = useMemo(() => everything.filter((m) => !isMastered(m, done)), [everything, done]);
  const mastered = useMemo(() => everything.filter((m) => isMastered(m, done)), [everything, done]);
  const reasonOf = (m: Pick<Mistake, "id" | "auto">) => tags[m.id] ?? m.auto;
  const stats = useMemo(() => mistakeStats(all, (m) => tags[m.id] ?? m.auto), [all, tags]);
  const base = view === "open" ? all : mastered;
  const { byId: textById } = useQuestions(query.trim().length > 2 ? base.map((m) => m.id) : null);

  const list = useMemo(() => {
    const ql = query.trim().toLowerCase();
    const filtered = base.filter(
      (m) =>
        (filter === "all" || reasonOf(m) === filter) &&
        (extra === "all" || (extra === "repeated" ? m.times >= 2 : m.kind === "skipped")) &&
        (topic === "all" || m.topic === topic) &&
        (ql.length < 3 || m.topic.toLowerCase().includes(ql) || (notes[m.id] ?? "").toLowerCase().includes(ql) || (textById?.get(m.id)?.question ?? "").toLowerCase().includes(ql)),
    );
    return sortMistakes(filtered, sort);
  }, [base, filter, extra, topic, sort, query, tags, notes, textById]); // eslint-disable-line react-hooks/exhaustive-deps
  const visible = list.slice(0, shown);
  const { byId } = useQuestions(visible.map((m) => m.id));

  useEffect(() => setShown(PAGE), [filter, extra, topic, sort, query, view]);

  async function exportCsv() {
    setExporting(true);
    try {
      const qs = await loadQuestions(list.map((m) => m.id));
      const text = mistakesToCsv(list.map((m) => ({ m, q: qs.get(m.id), reason: MISTAKE_REASONS.find((r) => r.id === reasonOf(m))?.label ?? "", note: notes[m.id] })));
      const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `error-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (!hydrated) return <PageSkeleton />;
  const weakest = stats.weakTopics.slice(0, 5);
  const filtered = filter !== "all" || extra !== "all" || topic !== "all" || query.trim().length > 0;

  return (
    <div>
      {dialog}
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Error log book</h1>
      <p className="mt-1 text-sm text-muted">
        Every question you got wrong or left blank, until you answer it correctly. Tag why it happened — your tag beats the automatic guess — add your
        own note, retry them, and mark the ones you have mastered.
      </p>

      {!everything.length ? (
        <Card className="mt-6 p-6 text-center">
          <p className="font-semibold">Nothing in the log yet.</p>
          <p className="mt-1 text-sm text-muted">Finish a test and the questions you miss will be collected here.</p>
        </Card>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Open mistakes" value={stats.open} />
            <Stat label="Missed 2+ times" value={stats.repeated} tone={stats.repeated ? "bad" : undefined} />
            <Stat label="Left blank" value={stats.blank} />
            <Stat label="Mastered" value={mastered.length} tone={mastered.length ? "good" : undefined} />
          </div>

          {stats.open > 0 && (
            <Card className="mt-3 p-4">
              <p className="text-sm font-semibold">Why they happened</p>
              <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-hairline" role="img" aria-label="Share of mistakes by reason">
                {MISTAKE_REASONS.map((r, i) =>
                  stats.byReason[r.id] ? <span key={r.id} title={`${r.label}: ${stats.byReason[r.id]}`} style={{ width: `${(stats.byReason[r.id] / stats.open) * 100}%`, opacity: 1 - i * 0.16 }} className="h-full bg-primary" /> : null,
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                {MISTAKE_REASONS.map((r, i) =>
                  stats.byReason[r.id] ? (
                    <span key={r.id}>
                      <span className="mr-1 inline-block size-2 rounded-full bg-primary align-middle" style={{ opacity: 1 - i * 0.16 }} />
                      {r.label} <b className="text-fg tabular">{stats.byReason[r.id]}</b>
                    </span>
                  ) : null,
                )}
              </div>
              {weakest.length > 0 && (
                <>
                  <p className="mt-3 text-sm font-semibold">Weakest topics — tap to practise them</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {weakest.map((w) => (
                      <Chip key={w.topic} on={topic === w.topic} onClick={() => (setView("open"), setTopic(topic === w.topic ? "all" : w.topic))}>
                        {w.topic} <span className="ml-1 opacity-70 tabular">{w.n}</span>
                      </Chip>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}

          <div className="mt-4 flex gap-2" role="group" aria-label="Show">
            <Chip on={view === "open"} onClick={() => setView("open")}>
              Open <span className="ml-1 opacity-70 tabular">{all.length}</span>
            </Chip>
            <Chip on={view === "mastered"} onClick={() => setView("mastered")}>
              <Trophy size={13} className="mr-1 inline" />
              Mastered <span className="ml-1 opacity-70 tabular">{mastered.length}</span>
            </Chip>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-hairline px-3">
            <Search size={16} className="text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions, topics, notes"
              aria-label="Search the log"
              className="w-full bg-transparent py-2.5 text-sm outline-none"
            />
          </div>

          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <Chip on={filter === "all" && extra === "all"} onClick={() => (setFilter("all"), setExtra("all"))}>
              All
            </Chip>
            <Chip on={extra === "repeated"} onClick={() => setExtra(extra === "repeated" ? "all" : "repeated")}>
              Missed 2+ times
            </Chip>
            <Chip on={extra === "blank"} onClick={() => setExtra(extra === "blank" ? "all" : "blank")}>
              Left blank
            </Chip>
            {MISTAKE_REASONS.map((r) => (
              <Chip key={r.id} on={filter === r.id} onClick={() => setFilter(filter === r.id ? "all" : r.id)}>
                {r.label} <span className="ml-1 opacity-70 tabular">{stats.byReason[r.id] ?? 0}</span>
              </Chip>
            ))}
          </div>
          <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <Chip on={topic === "all"} onClick={() => setTopic("all")}>
              All topics
            </Chip>
            {stats.weakTopics.slice(0, 12).map((t) => (
              <Chip key={t.topic} on={topic === t.topic} onClick={() => setTopic(t.topic)}>
                {t.topic} <span className="ml-1 opacity-70 tabular">{t.n}</span>
              </Chip>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as MistakeSort)} className="rounded-xl border border-hairline bg-transparent px-2 py-1.5 text-sm">
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <Button size="sm" variant="outline" disabled={!list.length || exporting} onClick={exportCsv}>
              <Download size={15} /> {exporting ? "Preparing…" : "Download CSV"}
            </Button>
          </div>

          {view === "open" && (
            <Card className="mt-4 p-4">
              <p className="text-sm font-semibold">Retry {filtered ? "these" : "my mistakes"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {RETRY_SIZES.map((n) => (
                  <Chip key={n} on={retry === n} onClick={() => setRetry(n)}>
                    {n} questions
                  </Chip>
                ))}
                <Button
                  disabled={!list.length}
                  onClick={() => start(mistakeTest(list.map((m) => m.id), filtered ? "Retry mistakes · filtered" : "Retry my mistakes", schemeId, retry))}
                >
                  <RotateCcw size={17} /> Retry {Math.min(list.length, retry)} of {list.length}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted">Practice mode, shuffled, with explanations. A question you now get right leaves the log by itself.</p>
            </Card>
          )}

          <SectionTitle>
            {list.length} question{list.length === 1 ? "" : "s"}
            {view === "mastered" ? " mastered" : ""}
          </SectionTitle>
          {list.length === 0 && (
            <Card className="p-4 text-sm text-muted">{view === "mastered" ? "Nothing marked as mastered yet." : "No mistakes match these filters."}</Card>
          )}
          <div className="grid gap-3">
            {visible.map((m) => {
              const q = byId?.get(m.id);
              const mine = reasonOf(m);
              return <MistakeCard key={m.id} m={m} q={q} mine={mine} mastered={view === "mastered"} tag={tags[m.id]} note={notes[m.id] ?? ""} setTag={setTag} setNote={setNote} toggleDone={toggleDone} />;
            })}
          </div>
          {shown < list.length && (
            <Button variant="soft" className="mt-4 w-full" onClick={() => setShown((n) => n + PAGE)}>
              Show more
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
  return (
    <Card className="p-3 text-center">
      <div className={cx("font-display text-2xl font-bold tabular", tone === "bad" && "text-bad", tone === "good" && "text-good")}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </Card>
  );
}

function MistakeCard({
  m,
  q,
  mine,
  tag,
  note,
  mastered,
  setTag,
  setNote,
  toggleDone,
}: {
  m: Mistake;
  q: import("@/lib/types").Question | undefined;
  mine: MistakeReason;
  tag: MistakeReason | undefined;
  note: string;
  mastered: boolean;
  setTag: (id: number, tag: MistakeReason | null) => void;
  setNote: (id: number, note: string) => void;
  toggleDone: (id: number) => void;
}) {
  const [noteOpen, setNoteOpen] = useState(!!note);
  const [text, setText] = useState(note);
  useEffect(() => {
    if (text === note) return;
    const t = setTimeout(() => setNote(m.id, text), 500);
    return () => clearTimeout(t);
  }, [text, note, m.id, setNote]);
  const ago = daysAgo(m.lastAt);

  return (
    <Card className={cx("p-4", mastered && "opacity-90")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="font-semibold text-fg">{m.topic}</span>
        <span>{m.kind === "skipped" ? "left blank" : "answered wrong"}</span>
        {m.times > 1 && <span className="font-semibold text-bad">missed {m.times}×</span>}
        <span>{ago === 0 ? "last missed today" : `last missed ${ago} day${ago > 1 ? "s" : ""} ago`}</span>
      </div>
      {q ? (
        <>
          <QuestionText text={q.question} className="mt-2 text-base" />
          <div className="mt-3 grid gap-1.5 text-sm">
            {q.options.map((o, i) => (
              <div
                key={i}
                className={cx(
                  "flex gap-2 rounded-xl px-3 py-2",
                  i === m.correctAnswer && "bg-good-soft font-semibold text-good",
                  i === m.yourAnswer && i !== m.correctAnswer && "bg-bad-soft text-bad line-through",
                )}
              >
                <b>{LETTERS[i]}</b>
                <span>{o}</span>
                {i === m.correctAnswer && <Check size={16} className="ml-auto shrink-0" />}
              </div>
            ))}
          </div>
          {q.explanation && <p className="mt-2 whitespace-pre-line text-sm text-muted">{q.explanation}</p>}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">Loading question…</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {MISTAKE_REASONS.map((r) => (
          <button
            key={r.id}
            title={r.hint}
            onClick={() => setTag(m.id, tag === r.id ? null : r.id)}
            className={cx("rounded-full border px-2.5 py-1 text-xs font-semibold", mine === r.id ? "border-primary bg-primary-soft text-primary" : "border-hairline text-muted")}
          >
            {r.label}
            {mine === r.id && !tag && <span className="ml-1 font-normal opacity-70">(auto)</span>}
          </button>
        ))}
      </div>
      {noteOpen ? (
        <label className="mt-3 block text-xs font-bold text-muted">
          My note — the rule, trick or fact to remember
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 block min-h-16 w-full rounded-xl border border-hairline bg-transparent p-2 text-sm font-normal text-fg outline-none focus:border-primary"
          />
        </label>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {!noteOpen && (
          <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>
            <StickyNote size={14} /> Add note
          </Button>
        )}
        <Button size="sm" variant={mastered ? "outline" : "soft"} onClick={() => toggleDone(m.id)}>
          <Trophy size={14} /> {mastered ? "Move back to open" : "I've mastered this"}
        </Button>
      </div>
    </Card>
  );
}

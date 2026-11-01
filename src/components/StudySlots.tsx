"use client";

import { Check, MoonStar, Plus, Search, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import type { LoadedBank, TopicInfo } from "@/lib/bank";
import { DAY_TARGET, dayTotal, ROUND_LABEL, SLOT_ROUND_MAX, SLOTS, sleepAttempt, sleepQuiz, slotQuiz, slotState } from "@/lib/slots";
import { scoreAttempt } from "@/lib/scoring";
import type { Attempt, QStat, TestConfig } from "@/lib/types";
import { Button, ButtonLink, Card, Sheet } from "./ui";

/**
 * Five study slots a day. Before each study block the student picks the topic they are about to study and gets
 * 10 practice questions on it; a last round before sleep revises the day's mistakes.
 */
export function StudySlots({
  bank,
  attempts,
  qstats,
  day,
  schemeId,
  start,
}: {
  bank: LoadedBank | null;
  attempts: Attempt[];
  qstats: Record<number, QStat>;
  day: string;
  schemeId: string;
  start: (c: TestConfig | null) => void;
}) {
  const [pick, setPick] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [chosen, setChosen] = useState<TopicInfo | null>(null);

  const states = SLOTS.map((s) => slotState(attempts, day, s.id));
  const total = dayTotal(attempts, day);
  const sleep = sleepAttempt(attempts, day);
  const sleepCfg = bank ? sleepQuiz(attempts, day, schemeId, bank.isActive) : null;

  const topics = useMemo(() => {
    if (!bank) return [];
    const q = query.trim().toLowerCase();
    return bank.topics.filter((t) => t.qids.length > 0 && (subject === "all" || t.subject === subject) && (!q || t.name.toLowerCase().includes(q)));
  }, [bank, query, subject]);

  const open = (slot: number) => {
    const st = states[slot - 1];
    // After study: same topic, fresh questions, no need to pick again.
    if (st.topic && bank) {
      const same = bank.topics.find((t) => t.name === st.topic);
      const cfg = same ? slotQuiz(same, attempts, qstats, day, slot, schemeId) : null;
      if (cfg) return start(cfg);
    }
    const last = st.topic ? bank?.topics.find((t) => t.name === st.topic) ?? null : null;
    setChosen(last);
    setQuery("");
    setPick(slot);
  };

  const go = () => {
    if (!bank || !chosen || pick == null) return;
    const cfg = slotQuiz(chosen, attempts, qstats, day, pick, schemeId);
    if (!cfg) return;
    setPick(null);
    start(cfg);
  };

  const subjectName = (id: string) => bank?.subjects.find((s) => s.id === id)?.name ?? id;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold">Today&apos;s study slots</h3>
          <p className="text-sm text-muted">Pick the topic you are about to study. 10 questions before you sit down and 10 after you get up, in five slots.</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-xl font-bold">{total}</div>
          <div className="text-xs text-muted">of {DAY_TARGET} today</div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-hairline">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (total / DAY_TARGET) * 100)}%` }} />
      </div>

      <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2">
        {SLOTS.map((s, i) => {
          const st = states[i];
          const done = st.attempts.length > 0;
          const last = st.attempts[st.attempts.length - 1];
          return (
            <li key={s.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-hairline p-3">
              <div className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-primary-soft text-primary"}`}>
                {done ? <Check size={18} /> : s.id}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{s.label}</div>
                <div className="truncate text-sm text-muted">
                  {!done
                    ? s.hint
                    : st.scores.length > 1
                      ? `${st.topic} · before ${st.scores[0].correct}/${st.scores[0].asked} → after ${st.scores[1].correct}/${st.scores[1].asked}`
                      : `${st.topic} · before ${st.scores[0].correct}/${st.scores[0].asked}. Study it, then take the after-study 10`}
                </div>
              </div>
              {last && (
                <ButtonLink size="sm" variant="soft" href={`/results?id=${last.id}`}>
                  Review
                </ButtonLink>
              )}
              {st.nextRound <= SLOT_ROUND_MAX ? (
                <Button size="sm" variant={done ? "outline" : "primary"} disabled={!bank} onClick={() => open(s.id)}>
                  {done ? (
                    <>
                      <Plus size={14} /> {ROUND_LABEL[1]}
                    </>
                  ) : (
                    "Pick topic"
                  )}
                </Button>
              ) : null}
            </li>
          );
        })}
        <li className="flex items-center gap-3 rounded-2xl border border-dashed border-hairline p-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
            <MoonStar size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">Before sleep</div>
            <div className="truncate text-sm text-muted">
              {sleep ? `Done · ${scoreAttempt(sleep).correct}/${sleep.config.qids.length} correct` : sleepCfg ? `Revise ${sleepCfg.qids.length} questions you missed today` : "Opens once you have missed a question today"}
            </div>
          </div>
          {sleep ? (
            <ButtonLink size="sm" variant="soft" href={`/results?id=${sleep.id}`}>
              Review
            </ButtonLink>
          ) : (
            <Button size="sm" variant="soft" disabled={!sleepCfg} onClick={() => start(sleepCfg)}>
              Start
            </Button>
          )}
        </li>
      </ul>

      <Sheet open={pick != null} onClose={() => setPick(null)} title={pick != null ? `${SLOTS[pick - 1].label}: choose a topic` : ""} wide>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a topic or chapter"
              className="h-11 w-full rounded-2xl border border-hairline bg-glass pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            aria-label="Subject"
            className="h-11 max-w-[45%] rounded-2xl border border-hairline bg-glass px-3 text-sm outline-none focus:border-primary"
          >
            <option value="all">All subjects</option>
            {bank?.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <ul className="mt-3 grid max-h-[46dvh] grid-cols-[minmax(0,1fr)] gap-1.5 overflow-y-auto pr-1">
          {topics.slice(0, 120).map((t) => {
            const on = chosen?.name === t.name && chosen.subject === t.subject;
            return (
              <li key={`${t.subject}:${t.name}`}>
                <button
                  onClick={() => setChosen(t)}
                  aria-pressed={on}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${on ? "border-primary bg-primary-soft" : "border-hairline hover:border-primary/40"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{t.name}</span>
                    <span className="block truncate text-xs text-muted">{subjectName(t.subject)}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{t.qids.length} Q</span>
                </button>
              </li>
            );
          })}
          {topics.length === 0 && <li className="p-4 text-center text-sm text-muted">No topic matches. Try another word.</li>}
          {topics.length > 120 && <li className="p-2 text-center text-xs text-muted">Showing 120 of {topics.length}. Search to narrow down.</li>}
        </ul>
        <Button className="mt-4 w-full" disabled={!chosen} onClick={go}>
          <Sun size={16} /> {chosen ? `Start 10 questions before study · ${chosen.name}` : "Choose a topic first"}
        </Button>
      </Sheet>
    </Card>
  );
}

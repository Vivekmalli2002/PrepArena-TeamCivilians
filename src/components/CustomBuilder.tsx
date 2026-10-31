"use client";

import { Sparkles } from "lucide-react";
import { chapterWeight } from "@/content/patterns";
import { useMemo, useState } from "react";
import type { LoadedBank } from "@/lib/bank";
import { SCHEMES } from "@/lib/scoring";
import { useApp } from "@/lib/store";
import { customTest, poolFilter, type Pool } from "@/lib/tests";
import type { Mode, TestConfig } from "@/lib/types";
import { Button, Card, Chip, Segmented } from "./ui";

const POOLS: { value: Pool; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unseen", label: "Unseen" },
  { value: "revision", label: "Revise" },
  { value: "bookmarked", label: "Saved" },
];

export function CustomBuilder({
  bank,
  defaultScheme,
  onStart,
}: {
  bank: LoadedBank;
  defaultScheme: string;
  onStart: (c: TestConfig | null) => void;
}) {
  const qstats = useApp((s) => s.qstats);
  const bookmarks = useApp((s) => s.bookmarks);
  const [topics, setTopics] = useState<string[]>(bank.topics.map((t) => t.name));
  const [pool, setPool] = useState<Pool>("all");
  const [count, setCount] = useState(25);
  const [timed, setTimed] = useState(true);
  const [mode, setMode] = useState<Mode>("exam");
  const [schemeId, setSchemeId] = useState(defaultScheme);
  const [weighted, setWeighted] = useState(false);
  const hasWeights = useMemo(() => bank.topics.some((t) => chapterWeight(t.name) != null), [bank]);

  const available = useMemo(() => {
    const keep = poolFilter(pool, qstats, bookmarks);
    return bank.topics.filter((t) => topics.includes(t.name)).flatMap((t) => t.qids).filter(keep).length;
  }, [bank, topics, pool, qstats, bookmarks]);

  const n = Math.min(count, available);
  const all = topics.length === bank.topics.length;
  const toggle = (t: string) => setTopics((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));

  return (
    <Card className="mt-5 space-y-6 p-5">
      <Field label="Topics" hint={`${topics.length} selected`}>
        <div className="mb-2 flex flex-wrap gap-2">
          <Chip on={all} onClick={() => setTopics(all ? [] : bank.topics.map((t) => t.name))}>
            All topics
          </Chip>
        </div>
        <div className="grid gap-2">
          {bank.subjects.map((sj) => {
            const own = bank.topics.filter((t) => t.subject === sj.id);
            if (!own.length) return null;
            const picked = own.filter((t) => topics.includes(t.name)).length;
            return (
              <details key={sj.id} className="rounded-2xl border border-hairline p-3" open={bank.subjects.length === 1}>
                <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold">
                  <span>{sj.name}</span>
                  <span className="text-xs font-normal text-muted tabular">
                    {picked}/{own.length} chapters
                  </span>
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip
                    on={picked === own.length}
                    onClick={() =>
                      setTopics((x) =>
                        picked === own.length
                          ? x.filter((n) => !own.some((t) => t.name === n))
                          : [...new Set([...x, ...own.map((t) => t.name)])],
                      )
                    }
                  >
                    Whole subject
                  </Chip>
                  {own.map((t) => (
                    <Chip key={t.name} on={!all && topics.includes(t.name)} onClick={() => (all ? setTopics([t.name]) : toggle(t.name))}>
                      {t.name} <span className="ml-1 opacity-70 tabular">{t.count}</span>
                    </Chip>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </Field>

      <Field label="Questions from">
        <Segmented label="Question pool" value={pool} onChange={setPool} options={POOLS} />
      </Field>

      <Field label="Number of questions" hint={`${available} available`}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={available || 1}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            className="h-11 w-24 rounded-xl border border-hairline bg-transparent text-center font-display text-xl font-bold tabular"
            aria-label="Number of questions"
          />
          {[25, 50, 100, 150].map((v) => (
            <Chip key={v} on={count === v} onClick={() => setCount(v)}>
              {v}
            </Chip>
          ))}
          <Chip on={count >= available && available > 0} onClick={() => setCount(Math.max(1, available))}>
            All {available}
          </Chip>
        </div>
        {hasWeights && (
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={weighted} onChange={(e) => setWeighted(e.target.checked)} />
            Follow exam weightage (more questions from chapters the real papers ask most)
          </label>
        )}
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Mode">
          <Segmented
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "exam", label: "Exam" },
              { value: "practice", label: "Practice" },
            ]}
          />
        </Field>
        <Field label="Timer">
          <Segmented
            label="Timer"
            value={timed ? "on" : "off"}
            onChange={(v) => setTimed(v === "on")}
            options={[
              { value: "on", label: `${n} min` },
              { value: "off", label: "Untimed" },
            ]}
          />
        </Field>
      </div>

      <Field label="Marking scheme">
        <div className="flex flex-wrap gap-2">
          {SCHEMES.map((s) => (
            <Chip key={s.id} on={schemeId === s.id} onClick={() => setSchemeId(s.id)}>
              {s.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Button
        size="lg"
        className="w-full"
        disabled={!n}
        onClick={() =>
          onStart(customTest(bank, { topics, count: n, minutes: timed ? n : 0, mode, schemeId, pool, weight: weighted ? chapterWeight : undefined }, qstats, bookmarks))
        }
      >
        <Sparkles size={18} /> {n ? `Build test · ${n} questions` : "No questions match"}
      </Button>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-bold">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

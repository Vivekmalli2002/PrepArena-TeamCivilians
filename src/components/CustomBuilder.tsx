"use client";

import { Sparkles } from "lucide-react";
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
  { value: "wrong", label: "Wrong" },
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
        <div className="flex flex-wrap gap-2">
          <Chip on={all} onClick={() => setTopics(all ? [] : bank.topics.map((t) => t.name))}>
            All topics
          </Chip>
          {bank.topics.map((t) => (
            <Chip key={t.name} on={!all && topics.includes(t.name)} onClick={() => (all ? setTopics([t.name]) : toggle(t.name))}>
              {t.name}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Questions from">
        <Segmented label="Question pool" value={pool} onChange={setPool} options={POOLS} />
      </Field>

      <Field label="Number of questions" hint={`${available} available`}>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="flex-1 accent-[var(--primary)]"
            aria-label="Number of questions"
          />
          <span className="w-12 text-right font-display text-xl font-bold tabular">{count}</span>
        </div>
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
          onStart(customTest(bank, { topics, count: n, minutes: timed ? n : 0, mode, schemeId, pool }, qstats, bookmarks))
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

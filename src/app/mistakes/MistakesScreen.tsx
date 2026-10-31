"use client";

import { Check, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { examById } from "@/content/catalog";
import { MISTAKE_REASONS, type MistakeReason } from "@/lib/extras";
import { useQuestions } from "@/lib/bank";
import { LETTERS } from "@/lib/format";
import { collectMistakes } from "@/lib/mistakes";
import { useApp, useHydrated } from "@/lib/store";
import { mistakeTest } from "@/lib/tests";
import { QuestionText } from "@/components/QuestionView";
import { useStartTest } from "@/components/useStartTest";
import { Button, Card, Chip, PageSkeleton, SectionTitle, cx } from "@/components/ui";

const PAGE = 15;

export function MistakesScreen() {
  const hydrated = useHydrated();
  const attempts = useApp((s) => s.attempts);
  const tags = useApp((s) => s.mistakeTags);
  const setTag = useApp((s) => s.setMistakeTag);
  const examId = useApp((s) => s.profile?.examId);
  const schemeId = examById(examId)?.schemeId ?? "appsc";
  const { start, dialog } = useStartTest();
  const [filter, setFilter] = useState<MistakeReason | "all" | "untagged">("all");
  const [topic, setTopic] = useState<string>("all");
  const [shown, setShown] = useState(PAGE);

  const all = useMemo(() => collectMistakes(attempts), [attempts]);
  const reasonOf = (id: number, auto: MistakeReason) => tags[id] ?? auto;
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of all) c[reasonOf(m.id, m.auto)] = (c[reasonOf(m.id, m.auto)] ?? 0) + 1;
    return c;
  }, [all, tags]); // eslint-disable-line react-hooks/exhaustive-deps
  const topics = useMemo(() => {
    const c = new Map<string, number>();
    for (const m of all) c.set(m.topic, (c.get(m.topic) ?? 0) + 1);
    return [...c].sort((a, b) => b[1] - a[1]);
  }, [all]);
  const list = all.filter(
    (m) =>
      (filter === "all" || (filter === "untagged" ? !tags[m.id] : reasonOf(m.id, m.auto) === filter)) &&
      (topic === "all" || m.topic === topic),
  );
  const visible = list.slice(0, shown);
  const { byId } = useQuestions(visible.map((m) => m.id));

  if (!hydrated) return <PageSkeleton />;
  return (
    <div>
      {dialog}
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Mistake notebook</h1>
      <p className="mt-1 text-sm text-muted">
        Every question you got wrong or left blank, until you answer it correctly. Tag why it happened — your tag beats the
        automatic guess — and retry them.
      </p>

      {!all.length ? (
        <Card className="mt-6 p-6 text-center">
          <p className="font-semibold">No open mistakes.</p>
          <p className="mt-1 text-sm text-muted">Finish a test and the questions you miss will be collected here.</p>
        </Card>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip on={filter === "all"} onClick={() => (setFilter("all"), setShown(PAGE))}>
              All <span className="ml-1 opacity-70 tabular">{all.length}</span>
            </Chip>
            {MISTAKE_REASONS.map((r) => (
              <Chip key={r.id} on={filter === r.id} onClick={() => (setFilter(r.id), setShown(PAGE))}>
                {r.label} <span className="ml-1 opacity-70 tabular">{counts[r.id] ?? 0}</span>
              </Chip>
            ))}
          </div>
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <Chip on={topic === "all"} onClick={() => (setTopic("all"), setShown(PAGE))}>
              All topics
            </Chip>
            {topics.slice(0, 12).map(([t, n]) => (
              <Chip key={t} on={topic === t} onClick={() => (setTopic(t), setShown(PAGE))}>
                {t} <span className="ml-1 opacity-70 tabular">{n}</span>
              </Chip>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              disabled={!list.length}
              onClick={() => start(mistakeTest(list.map((m) => m.id), filter === "all" && topic === "all" ? "Retry my mistakes" : "Retry mistakes · filtered", schemeId))}
            >
              <RotateCcw size={17} /> Retry {Math.min(list.length, 50)} of {list.length}
            </Button>
            <span className="text-sm text-muted">Practice mode, shuffled, with explanations.</span>
          </div>

          <SectionTitle>{list.length} question{list.length === 1 ? "" : "s"}</SectionTitle>
          <div className="grid gap-3">
            {visible.map((m) => {
              const q = byId?.get(m.id);
              const mine = reasonOf(m.id, m.auto);
              return (
                <Card key={m.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="font-semibold text-fg">{m.topic}</span>
                    <span>{m.kind === "skipped" ? "left blank" : "answered wrong"}</span>
                    {m.times > 1 && <span className="font-semibold text-bad">missed {m.times}×</span>}
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
                        onClick={() => setTag(m.id, tags[m.id] === r.id ? null : r.id)}
                        className={cx(
                          "rounded-full border px-2.5 py-1 text-xs font-semibold",
                          mine === r.id ? "border-primary bg-primary-soft text-primary" : "border-hairline text-muted",
                        )}
                      >
                        {r.label}
                        {mine === r.id && !tags[m.id] && <span className="ml-1 font-normal opacity-70">(auto)</span>}
                      </button>
                    ))}
                  </div>
                </Card>
              );
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

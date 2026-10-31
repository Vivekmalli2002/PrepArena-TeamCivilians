"use client";

import { motion } from "framer-motion";
import { ChevronRight, Play, Search, Timer, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { examById } from "@/content/catalog";
import { useBank, type TopicInfo } from "@/lib/bank";
import { pct } from "@/lib/format";
import { bestByKey, bestByTopic } from "@/lib/selectors";
import { useApp, useHydrated } from "@/lib/store";
import { FULL_MOCK, fullMock, subtopicTest, TOPIC_MOCK, topicMock, topicSets, topicSetTest } from "@/lib/tests";
import { CustomBuilder } from "@/components/CustomBuilder";
import { ProgressRing } from "@/components/ProgressRing";
import { useStartTest } from "@/components/useStartTest";
import { Button, Card, PageSkeleton, Segmented, SectionTitle, Sheet, cx, enter } from "@/components/ui";

type Tab = "topics" | "mocks" | "custom";

export function CatalogScreen() {
  const hydrated = useHydrated();
  const { bank, error } = useBank();
  const [tab, setTab] = useState<Tab>("topics");
  const [query, setQuery] = useState("");
  const [openTopic, setOpenTopic] = useState<TopicInfo | null>(null);
  const attempts = useApp((s) => s.attempts);
  const qstats = useApp((s) => s.qstats);
  const examId = useApp((s) => s.profile?.examId);
  const schemeId = examById(examId)?.schemeId ?? "appsc";
  const { start, dialog } = useStartTest();

  const byTopic = useMemo(() => bestByTopic(attempts), [attempts]);
  const byKey = useMemo(() => bestByKey(attempts), [attempts]);

  if (error) return <p className="text-bad">{error}</p>;
  if (!hydrated || !bank) return <PageSkeleton />;

  const topics = bank.topics.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()));
  const seenIn = (qids: number[]) => qids.filter((id) => qstats[id]).length;

  return (
    <div>
      {dialog}
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Tests</h1>
      <p className="mt-1 text-sm text-muted">
        {bank.subject.name} · {bank.total} questions
      </p>

      <Segmented
        label="Catalog section"
        className="mt-5 max-w-md"
        value={tab}
        onChange={setTab}
        options={[
          { value: "topics", label: "Topics" },
          { value: "mocks", label: "Mock tests" },
          { value: "custom", label: "Custom" },
        ]}
      />

      {tab === "topics" && (
        <>
          <label className="glass mt-4 flex h-12 items-center gap-2 rounded-2xl px-4">
            <Search size={18} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics"
              aria-label="Search topics"
              className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-faint"
            />
          </label>
          <motion.div
            key={query}
            variants={enter.container}
            initial="hidden"
            animate="show"
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {topics.map((t) => {
              const seen = seenIn(t.qids);
              const best = byTopic.get(t.name);
              return (
                <motion.button
                  key={t.name}
                  variants={enter.item}
                  onClick={() => setOpenTopic(t)}
                  className="glass flex items-center gap-4 rounded-3xl p-4 text-left transition hover:-translate-y-0.5"
                >
                  <ProgressRing value={seen / t.count} size={54} stroke={5} label={`${pct(seen / t.count)} practised`}>
                    <span className="text-xs font-bold tabular">{Math.round((seen / t.count) * 100)}%</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold leading-snug">{t.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>{t.count} Q</span>
                      <span>{topicSets(t.qids).length} sets</span>
                      {best != null && (
                        <span className="flex items-center gap-1 font-semibold text-good">
                          <Trophy size={12} /> Best {pct(best)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-muted" />
                </motion.button>
              );
            })}
            {!topics.length && <p className="text-muted">No topic matches “{query}”.</p>}
          </motion.div>
        </>
      )}

      {tab === "mocks" && (
        <motion.div variants={enter.container} initial="hidden" animate="show">
          <motion.div variants={enter.item}>
            <Card strong className="relative mt-5 overflow-hidden p-5">
              <div className="absolute -right-12 -top-12 size-44 rounded-full bg-primary/20 blur-2xl" />
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Full mock</p>
              <h2 className="mt-1 font-display text-2xl font-bold">
                {FULL_MOCK.count} questions · {FULL_MOCK.minutes} minutes
              </h2>
              <p className="mt-1 text-sm text-muted">
                Drawn from all {bank.topics.length} topics in proportion · exam mode · negative marking
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Button onClick={() => start(fullMock(bank, schemeId))}>
                  <Timer size={18} /> Start mock
                </Button>
                {byKey.has(`mock:full:${FULL_MOCK.count}`) && (
                  <span className="text-sm font-semibold text-good">
                    Best {pct(byKey.get(`mock:full:${FULL_MOCK.count}`)!)}
                  </span>
                )}
              </div>
            </Card>
          </motion.div>
          <SectionTitle>Topic mocks</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {bank.topics.map((t) => {
              const best = byKey.get(`topic-mock:${t.name}`);
              const n = Math.min(TOPIC_MOCK.count, t.count);
              return (
                <motion.div key={t.name} variants={enter.item}>
                  <Card className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold leading-snug">{t.name}</div>
                      <div className="text-xs text-muted">
                        {n} Q · {n} min{best != null && <> · <b className="text-good">Best {pct(best)}</b></>}
                      </div>
                    </div>
                    <Button size="sm" variant="soft" onClick={() => start(topicMock(t.name, t.qids, schemeId))}>
                      Start
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {tab === "custom" && <CustomBuilder bank={bank} defaultScheme={schemeId} onStart={start} />}

      <Sheet open={!!openTopic} onClose={() => setOpenTopic(null)} title={openTopic?.name ?? ""} wide>
        {openTopic && (
          <TopicDetail
            topic={openTopic}
            seenIn={seenIn}
            best={byKey}
            onStart={(cfg) => {
              setOpenTopic(null);
              start(cfg);
            }}
            schemeId={schemeId}
          />
        )}
      </Sheet>
    </div>
  );
}

function TopicDetail({
  topic,
  seenIn,
  best,
  onStart,
  schemeId,
}: {
  topic: TopicInfo;
  seenIn: (q: number[]) => number;
  best: Map<string, number>;
  onStart: (c: ReturnType<typeof topicSetTest>) => void;
  schemeId: string;
}) {
  const sets = topicSets(topic.qids);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => onStart(topicMock(topic.name, topic.qids, schemeId))}>
          <Timer size={17} /> Topic mock
        </Button>
        <Button
          variant="soft"
          onClick={() => {
            const i = Math.max(0, sets.findIndex((s) => seenIn(s) < s.length));
            onStart(topicSetTest(topic.name, i, sets[i], "practice", schemeId));
          }}
        >
          <Play size={17} /> Continue
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Topic mock: {Math.min(TOPIC_MOCK.count, topic.count)} random questions, timed, exam mode. Sets are practice
        mode by default — you can switch on the instructions screen.
      </p>

      {topic.subtopics.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-faint">Sub-topics</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {topic.subtopics.map((s) => (
              <button
                key={s.name}
                onClick={() => onStart(subtopicTest(topic.name, s.name, s.qids, "practice", schemeId))}
                className="rounded-2xl border border-hairline p-3 text-left hover:border-primary/40"
              >
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted">{s.qids.length} Q</div>
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-faint">Practice sets</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {sets.map((s, i) => {
          const seen = seenIn(s);
          const b = best.get(`topic:${topic.name}:${i}`);
          return (
            <button
              key={i}
              onClick={() => onStart(topicSetTest(topic.name, i, s, "practice", schemeId))}
              className="flex items-center gap-3 rounded-2xl border border-hairline bg-glass p-3 text-left transition hover:border-primary/40"
            >
              <ProgressRing value={seen / s.length} size={40} stroke={4}>
                <span className="text-[11px] font-bold">{i + 1}</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Set {i + 1}</div>
                <div className="text-xs text-muted">
                  {s.length} Q · {seen}/{s.length} done
                </div>
              </div>
              <span
                className={cx(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  b == null ? "bg-primary-soft text-primary" : "bg-good-soft text-good",
                )}
              >
                {b == null ? "New" : pct(b)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

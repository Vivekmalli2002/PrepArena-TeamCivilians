"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookmarkCheck, Check, ChevronDown, Eye, Play, RefreshCw, RotateCcw, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { examById } from "@/content/catalog";
import { useBank, useQuestions, type LoadedBank } from "@/lib/bank";
import { LETTERS } from "@/lib/format";
import { shuffle } from "@/lib/random";
import { dueLabel, inRevision, isDue } from "@/lib/srs";
import { useApp, useHydrated } from "@/lib/store";
import { revisionTest } from "@/lib/tests";
import type { QStat, Question } from "@/lib/types";
import { QuestionText } from "@/components/QuestionView";
import { useStartTest } from "@/components/useStartTest";
import { Button, ButtonLink, Card, Chip, PageSkeleton, Segmented, cx } from "@/components/ui";

type Tab = "cards" | "bookmarks" | "revision";
const DECK_SIZE = 20;

export function LearnScreen() {
  const hydrated = useHydrated();
  const { bank } = useBank();
  const bookmarks = useApp((s) => s.bookmarks);
  const qstats = useApp((s) => s.qstats);
  const [tab, setTab] = useState<Tab>("cards");

  // Revision set, most urgent first (spaced repetition: due date ascending).
  const revision = useMemo(
    () =>
      Object.entries(qstats)
        .filter(([, s]) => inRevision(s))
        .sort((a, b) => (a[1].due ?? 0) - (b[1].due ?? 0))
        .map(([id]) => Number(id)),
    [qstats],
  );
  const [now] = useState(() => Date.now());
  const due = revision.filter((id) => isDue(qstats[id], now));

  if (!hydrated || !bank) return <PageSkeleton />;

  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Learn</h1>
      <p className="mt-1 text-sm text-muted">Flip through questions, revisit what you saved and fix what you missed.</p>
      <Segmented
        label="Learn section"
        className="mt-5 max-w-md"
        value={tab}
        onChange={setTab}
        options={[
          { value: "cards", label: "Flashcards" },
          { value: "bookmarks", label: `Saved · ${bookmarks.length}` },
          { value: "revision", label: due.length ? `Revise · ${due.length} due` : `Revise · ${revision.length}` },
        ]}
      />
      {tab === "cards" && <Flashcards bank={bank} bookmarks={bookmarks} due={due} />}
      {tab === "bookmarks" && (
        <QuestionList
          bank={bank}
          ids={[...bookmarks].reverse()}
          kind="bookmarks"
          empty="Tap the bookmark icon on any question during a test or review to save it here."
        />
      )}
      {tab === "revision" && (
        <QuestionList
          bank={bank}
          ids={revision}
          kind="revision"
          qstats={qstats}
          now={now}
          empty="Questions you get wrong are collected here automatically and come back on a spaced schedule (1, 3, 7 and 16 days). Get them right each time and they graduate."
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type DeckId = "all" | "bookmarks" | "due" | `topic:${string}`;

function Flashcards({ bank, bookmarks, due }: { bank: LoadedBank; bookmarks: number[]; due: number[] }) {
  const [deckId, setDeckId] = useState<DeckId>(due.length ? "due" : "all");
  const [nonce, setNonce] = useState(0);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);

  const pool = useMemo(() => {
    if (deckId === "bookmarks") return bookmarks.filter(bank.isActive);
    if (deckId === "due") return due.filter(bank.isActive);
    if (deckId.startsWith("topic:")) return bank.topics.find((t) => `topic:${t.name}` === deckId)?.qids ?? [];
    return bank.allActive;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the deck is frozen until the student reshuffles or switches
  }, [deckId, bank, nonce]);
  // The due deck keeps its urgency order; the others are shuffled.
  const build = (ids: number[]) => (deckId === "due" ? ids : shuffle(ids)).slice(0, DECK_SIZE);
  const [deck, setDeck] = useState<number[]>(() => build(pool));
  const [deckKey, setDeckKey] = useState(`${deckId}:${nonce}`);
  if (deckKey !== `${deckId}:${nonce}`) {
    // Rebuild the deck during render when its inputs change (no effect round-trip).
    setDeckKey(`${deckId}:${nonce}`);
    setDeck(build(pool));
    setPos(0);
    setFlipped(false);
    setKnown(0);
  }

  const { byId } = useQuestions(deck);
  const q = byId?.get(deck[pos]);
  const finished = pos >= deck.length;

  const next = (gotIt: boolean) => {
    if (!q) return;
    if (gotIt) setKnown((k) => k + 1);
    useApp.getState().rateCard(q.id, gotIt);
    setFlipped(false);
    setPos((p) => p + 1);
  };

  const decks: { id: DeckId; label: string; n: number }[] = [
    { id: "due", label: "Due for review", n: due.length },
    { id: "all", label: "All topics", n: bank.total },
    { id: "bookmarks", label: "Saved", n: bookmarks.length },
    ...bank.topics.map((t) => ({ id: `topic:${t.name}` as DeckId, label: t.name, n: t.count })),
  ];

  return (
    <div className="mt-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {decks.map((d) => (
          <Chip key={d.id} on={deckId === d.id} onClick={() => setDeckId(d.id)} className={cx(!d.n && "opacity-50")}>
            {d.label} <span className="ml-1 opacity-70 tabular">{d.n}</span>
          </Chip>
        ))}
      </div>

      {!deck.length ? (
        <Card className="mt-4 p-8 text-center text-muted">This deck is empty for now.</Card>
      ) : finished ? (
        <Card strong className="mt-4 p-8 text-center">
          <h2 className="font-display text-2xl font-bold">Deck complete</h2>
          <p className="mt-2 text-muted">
            You knew <b className="text-fg">{known}</b> of {deck.length}.
          </p>
          <Button className="mt-6" onClick={() => setNonce((x) => x + 1)}>
            <RefreshCw size={17} /> New deck
          </Button>
        </Card>
      ) : !q ? (
        <div className="skeleton mt-4 h-[340px] rounded-3xl" />
      ) : (
        q && (
          <>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-semibold tabular">
                Card {pos + 1} <span className="text-muted">/ {deck.length}</span>
              </span>
              <button onClick={() => setNonce((x) => x + 1)} className="flex items-center gap-1.5 font-semibold text-primary">
                <Shuffle size={15} /> Reshuffle
              </button>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-hairline">
              <motion.div className="h-full bg-primary" animate={{ width: `${(pos / deck.length) * 100}%` }} />
            </div>
            <div className="mt-4 [perspective:1400px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${q.id}-${flipped}`}
                  initial={{ rotateY: flipped ? -90 : 0, opacity: flipped ? 0 : 0, y: flipped ? 0 : 14 }}
                  animate={{ rotateY: 0, opacity: 1, y: 0 }}
                  exit={{ rotateY: flipped ? 0 : 90, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <Card strong className="min-h-[340px] p-5 sm:p-7">
                    <p className="text-xs font-bold uppercase tracking-wider text-faint">
                      {q.topic} · {flipped ? "Answer" : "Question"}
                    </p>
                    {!flipped ? (
                      <>
                        <QuestionText text={q.question} className="mt-3" />
                        <ol className="mt-4 space-y-2">
                          {q.options.map((o, i) => (
                            <li key={i} className="flex gap-2.5">
                              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-hairline text-xs font-bold text-muted">
                                {LETTERS[i]}
                              </span>
                              <span className="pt-0.5">{o}</span>
                            </li>
                          ))}
                        </ol>
                      </>
                    ) : (
                      <CardBack q={q} />
                    )}
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {!flipped ? (
                <Button size="lg" className="col-span-2" onClick={() => setFlipped(true)}>
                  <Eye size={18} /> Show answer
                </Button>
              ) : (
                <>
                  <Button size="lg" variant="outline" onClick={() => next(false)}>
                    <RotateCcw size={17} /> Review again
                  </Button>
                  <Button size="lg" onClick={() => next(true)}>
                    <Check size={18} /> Got it
                  </Button>
                </>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}

function CardBack({ q }: { q: Question }) {
  return (
    <div className="mt-3">
      <div className="flex gap-3 rounded-2xl border-2 border-good bg-good-soft p-3.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-good text-sm font-bold text-white">
          {LETTERS[q.answerIndex]}
        </span>
        <span className="pt-1 text-[17px] font-semibold">{q.options[q.answerIndex]}</span>
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-faint">Explanation</p>
      <p className="mt-1.5 leading-relaxed">{q.explanation}</p>
      <p className="mt-3 text-xs text-muted">Source: {q.source}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function QuestionList({
  bank,
  ids,
  kind,
  empty,
  qstats,
  now = 0,
}: {
  bank: LoadedBank;
  ids: number[];
  kind: "bookmarks" | "revision";
  empty: string;
  qstats?: Record<number, QStat>;
  now?: number;
}) {
  const examId = useApp((s) => s.profile?.examId);
  const schemeId = examById(examId)?.schemeId ?? "appsc";
  const { start, dialog } = useStartTest();
  const [open, setOpen] = useState<number | null>(null);
  const [limit, setLimit] = useState(30);
  const { byId } = useQuestions(ids.slice(0, limit));
  const practisable = ids.filter(bank.isActive);
  const dueCount = qstats ? ids.filter((id) => isDue(qstats[id], now)).length : 0;

  if (!ids.length)
    return (
      <Card className="mt-4 p-8 text-center">
        <p className="mx-auto max-w-sm text-muted">{empty}</p>
        <ButtonLink href="/tests" variant="soft" className="mt-5">
          Take a test
        </ButtonLink>
      </Card>
    );

  return (
    <div className="mt-4">
      {dialog}
      <Card strong className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-bold">
            {kind === "bookmarks" ? `${ids.length} saved questions` : `${dueCount} due now · ${ids.length} in revision`}
          </div>
          <div className="text-sm text-muted">
            {kind === "bookmarks"
              ? "Test yourself on them"
              : "Each right answer pushes the next review further out (1 → 3 → 7 → 16 days)"}
          </div>
        </div>
        <Button
          disabled={!practisable.length}
          onClick={() =>
            start(
              revisionTest(
                kind === "bookmarks" ? shuffle(practisable) : practisable,
                kind === "bookmarks" ? "Saved questions" : "Revision set",
                schemeId,
              ),
            )
          }
        >
          <Play size={17} /> Practise {Math.min(25, practisable.length)}
        </Button>
      </Card>
      <div className="mt-3 space-y-2">
        {ids.slice(0, limit).map((id) => {
          const q = byId?.get(id);
          if (!q) return <div key={id} className="skeleton h-20 rounded-3xl" />;
          const s = qstats?.[id];
          const isOpen = open === id;
          return (
            <Card key={id} className="overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : id)}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className={cx("leading-snug", !isOpen && "line-clamp-2")}>{q.question}</p>
                  <p className="mt-1 text-xs text-muted">
                    {q.topic}
                    {kind === "revision" && s && (
                      <span className={cx("ml-2 font-semibold", isDue(s, now) ? "text-bad" : "text-good")}>
                        · {dueLabel(s, now)} · box {(s.box ?? 0) + 1}/5
                      </span>
                    )}
                    {q.status === "withdrawn" && <span className="ml-2 font-semibold text-warn">· withdrawn for correction</span>}
                  </p>
                </div>
                <ChevronDown size={18} className={cx("mt-0.5 shrink-0 text-muted transition", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="border-t border-hairline px-4 pb-4">
                  <CardBack q={q} />
                  <div className="mt-3 flex gap-2">
                    {kind === "bookmarks" ? (
                      <Button size="sm" variant="outline" onClick={() => useApp.getState().toggleBookmark(id)}>
                        <BookmarkCheck size={15} /> Remove
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => useApp.getState().clearFromRevision(id)}>
                        <Check size={15} /> I&apos;ve learnt this
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {ids.length > limit && (
          <Button variant="ghost" className="w-full" onClick={() => setLimit((l) => l + 30)}>
            Show more
          </Button>
        )}
      </div>
    </div>
  );
}

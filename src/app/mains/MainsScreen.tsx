"use client";

import { Check, ChevronDown, Flame, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import answers from "@/content/mains-answers.json";
import mains from "@/content/mains.json";
import { dayKey } from "@/lib/random";
import { buildQueue, CORE_DIMS, DIMS, frameFor, learnStreak, themeStats, type DimId, type MainsQ } from "@/lib/mainsLearn";
import { useApp, useHydrated } from "@/lib/store";
import { AnswerView } from "@/components/AnswerView";
import { Button, Card, Chip, PageSkeleton, Segmented, SectionTitle, cx } from "@/components/ui";

const QS = mains as unknown as MainsQ[];
const ANSWERS = answers as Record<string, { answer: string; source?: string }>;
const STATS = themeStats(QS);
const QUEUE = buildQueue(QS);
const BY_ID = new Map(QS.map((q) => [q.id, q]));
const RANK = new Map(STATS.map((t, i) => [t.theme, i + 1]));
const STAT = new Map(STATS.map((t) => [t.theme, t]));
const dimLabel = (d: string) => DIMS.find((x) => x.id === d)?.label ?? d;

type Tab = "today" | "themes" | "backlog" | "all";

export function MainsScreen() {
  const hydrated = useHydrated();
  const learn = useApp((s) => s.learn);
  const sync = useApp((s) => s.syncLearn);
  const setPerDay = useApp((s) => s.setPerDay);
  const more = useApp((s) => s.learnOneMore);
  const [tab, setTab] = useState<Tab>("today");
  const [theme, setTheme] = useState<string | null>(null);

  const today = dayKey(new Date());
  useEffect(() => {
    if (hydrated) sync(QUEUE, today);
  }, [hydrated, today, sync]);

  const doneN = Object.keys(learn.done).filter((id) => BY_ID.has(id)).length;
  const streak = useMemo(() => learnStreak(learn.done, today, (t) => dayKey(new Date(t))), [learn.done, today]);
  const backlog = learn.backlog.filter((id) => BY_ID.has(id) && !learn.done[id]);

  if (!hydrated) return <PageSkeleton />;
  const todayList = learn.today.filter((id) => BY_ID.has(id));
  const todayDone = todayList.filter((id) => learn.done[id]).length;

  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Group-I Mains learning</h1>
      <p className="mt-1 text-sm text-muted">
        Questions come in the order the commission keeps returning to them. Learn the model answer, mark it completed, and the next
        one arrives. Anything you leave undone goes to the backlog at the end.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <div className="font-display text-2xl font-bold tabular">{doneN}</div>
          <div className="text-xs text-muted">of {QS.length} learned</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 font-display text-2xl font-bold tabular">
            <Flame size={20} className={streak ? "text-amber-500" : "text-faint"} />
            {streak}
          </div>
          <div className="text-xs text-muted">day streak</div>
        </Card>
        <Card className="p-3 text-center">
          <div className={cx("font-display text-2xl font-bold tabular", backlog.length > 0 && "text-bad")}>{backlog.length}</div>
          <div className="text-xs text-muted">in backlog</div>
        </Card>
      </div>

      <Segmented
        label="Learning sections"
        className="mt-5"
        value={tab}
        onChange={setTab}
        options={[
          { value: "today", label: "Today" },
          { value: "themes", label: "Themes" },
          { value: "backlog", label: backlog.length ? `Backlog ${backlog.length}` : "Backlog" },
          { value: "all", label: "All" },
        ]}
      />

      {tab === "today" && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">Questions a day</span>
            {([1, 2, 3] as const).map((n) => (
              <Chip key={n} on={learn.perDay === n} onClick={() => setPerDay(n, QUEUE)}>
                {n}
              </Chip>
            ))}
          </div>
          <SectionTitle>
            {todayList.length ? `Today · ${todayDone} of ${todayList.length} completed` : "Today"}
          </SectionTitle>
          {todayList.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="font-semibold">Everything has been learned. 🎉</p>
              <p className="mt-1 text-sm text-muted">Add the next Group-I papers to the question bank and new ones will appear here.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {todayList.map((id, i) => (
                <StudyCard key={id} q={BY_ID.get(id)!} defaultOpen={i === 0 || !learn.done[id]} />
              ))}
            </div>
          )}
          {todayList.length > 0 && todayDone === todayList.length && (
            <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="font-semibold">Done for today — nicely done.</span>
              <Button size="sm" variant="soft" onClick={() => more(QUEUE)}>
                <Plus size={15} /> Learn one more
              </Button>
            </Card>
          )}
        </>
      )}

      {tab === "themes" && <Themes onPick={(t) => (setTheme(t), setTab("all"))} />}

      {tab === "backlog" && (
        <>
          <SectionTitle>{backlog.length ? `${backlog.length} to catch up on` : "Backlog is empty"}</SectionTitle>
          <p className="-mt-1 mb-3 text-sm text-muted">Questions that were served on an earlier day and not marked completed. They are served again once the new ones run out — or finish them here any time.</p>
          <div className="grid gap-4">
            {backlog.map((id) => (
              <StudyCard key={id} q={BY_ID.get(id)!} defaultOpen={false} />
            ))}
          </div>
        </>
      )}

      {tab === "all" && <AllQuestions theme={theme} setTheme={setTheme} />}
    </div>
  );
}

function Themes({ onPick }: { onPick: (t: string) => void }) {
  const done = useApp((s) => s.learn.done);
  const years = [...new Set(QS.map((q) => q.year))].sort((a, b) => a - b);
  return (
    <>
      <SectionTitle>Themes, most recurring first</SectionTitle>
      <p className="-mt-1 mb-3 text-sm text-muted">
        Counted over {years.length} sittings ({years[0]}–{years.at(-1)}). “Not asked yet” lists angles of the theme that have never come as a
        question — a likely way a repeat theme could return, based on past patterns, not a guarantee.
      </p>
      <div className="grid gap-3">
        {STATS.map((t, i) => {
          const learned = t.ids.filter((id) => done[id]).length;
          return (
            <button key={t.theme} onClick={() => onPick(t.theme)} className="glass rounded-3xl p-4 text-left transition hover:-translate-y-0.5">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-bold tabular text-primary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold leading-snug">{t.theme}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    Asked <b className="text-fg">{t.count}×</b> in {t.years.length} of {years.length} sittings · last {t.last} · {learned}/{t.count} learned
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-1" aria-label={`Sittings: ${t.years.join(", ")}`}>
                {years.map((y) => (
                  <span key={y} title={String(y)} className={cx("h-2 flex-1 rounded-full", t.years.includes(y) ? "bg-primary" : "bg-hairline")} />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                {CORE_DIMS.filter((d) => t.dims[d]).map((d) => (
                  <span key={d} className="rounded-full bg-good-soft px-2 py-0.5 text-good">
                    {dimLabel(d)} · {t.dims[d]}
                  </span>
                ))}
                {t.unseen.map((d) => (
                  <span key={d} className="rounded-full border border-dashed border-amber-400 px-2 py-0.5 text-amber-700 dark:text-amber-300">
                    Not asked yet: {dimLabel(d)}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function AllQuestions({ theme, setTheme }: { theme: string | null; setTheme: (t: string | null) => void }) {
  const done = useApp((s) => s.learn.done);
  const [status, setStatus] = useState<"all" | "todo" | "done">("all");
  const [year, setYear] = useState<number | "all">("all");
  const years = [...new Set(QS.map((q) => q.year))].sort((a, b) => b - a);
  const list = QS.filter((q) => (!theme || q.theme === theme) && (year === "all" || q.year === year) && (status === "all" || (status === "done") === !!done[q.id]));
  return (
    <>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip on={!theme} onClick={() => setTheme(null)}>
          All themes
        </Chip>
        {STATS.map((t) => (
          <Chip key={t.theme} on={theme === t.theme} onClick={() => setTheme(t.theme)}>
            {t.theme}
          </Chip>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {(["all", "todo", "done"] as const).map((s) => (
          <Chip key={s} on={status === s} onClick={() => setStatus(s)}>
            {s === "all" ? "Any status" : s === "todo" ? "To learn" : "Completed"}
          </Chip>
        ))}
        <Chip on={year === "all"} onClick={() => setYear("all")}>
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
        {list.map((q) => (
          <StudyCard key={q.id} q={q} defaultOpen={false} compact />
        ))}
      </div>
    </>
  );
}

/** One question: theme and recurrence, the model answer (or an answer frame while it is not loaded), notes and the completed button. */
function StudyCard({ q, defaultOpen, compact }: { q: MainsQ; defaultOpen: boolean; compact?: boolean }) {
  const done = useApp((s) => s.learn.done[q.id]);
  const complete = useApp((s) => s.completeQ);
  const uncomplete = useApp((s) => s.uncompleteQ);
  const note = useApp((s) => s.mains[q.id]?.text ?? "");
  const saveNote = useApp((s) => s.saveMains);
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState(note);
  const stat = STAT.get(q.theme);
  const ans = ANSWERS[q.id];

  useEffect(() => {
    if (text === note) return;
    const t = setTimeout(() => saveNote(q.id, { text }), 600);
    return () => clearTimeout(t);
  }, [text, note, q.id, saveNote]);

  return (
    <Card strong={!compact} className={cx("p-4", !!done && "opacity-90")}>
      <button className="flex w-full items-start gap-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={cx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2", done ? "border-good bg-good text-white" : "border-hairline")}>
          {done && <Check size={14} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <b className="text-fg">
              {q.year} · Q{q.no}
            </b>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-primary">
              #{RANK.get(q.theme)} {q.theme}
            </span>
            {stat && (
              <span>
                asked {stat.count}× · {stat.years.length} sittings
              </span>
            )}
          </span>
          <span className={cx("mt-1.5 block leading-snug", !open && "line-clamp-2")}>{q.question}</span>
        </span>
        <ChevronDown size={18} className={cx("mt-1 shrink-0 text-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-hairline pt-4">
          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
            {q.dims.map((d: DimId) => (
              <span key={d} className="rounded-full bg-good-soft px-2 py-0.5 text-good">
                {dimLabel(d)}
              </span>
            ))}
            {q.ap && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Andhra Pradesh</span>}
          </div>

          {ans ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Model answer</p>
              <AnswerView text={ans.answer} />
              {ans.source && <p className="mt-2 text-xs text-muted">{ans.source}</p>}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-hairline p-3">
              <p className="text-sm font-semibold">The model answer for this question is not loaded yet.</p>
              <p className="mt-1 text-xs text-muted">Until it is, use this frame and write your own key points below.</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                {frameFor(q).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          <label className="block text-sm font-bold">
            My key points
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Facts, data and examples you want to remember for this answer."
              className="mt-2 block min-h-24 w-full rounded-2xl border border-hairline bg-transparent p-3 font-normal leading-relaxed outline-none focus:border-primary"
            />
          </label>

          <Button className="w-full" variant={done ? "outline" : "primary"} onClick={() => (done ? uncomplete(q.id) : complete(q.id))}>
            <Check size={17} /> {done ? "Completed — tap to undo" : "Mark as completed"}
          </Button>
        </div>
      )}
    </Card>
  );
}

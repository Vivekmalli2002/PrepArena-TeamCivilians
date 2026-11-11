"use client";

import { ArrowRight, CalendarDays, Check, ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Chip, PageSkeleton, cx } from "@/components/ui";
import { dayKey } from "@/lib/random";
import {
  DAYS,
  PHASES,
  PHASE_ORDER,
  dayDone,
  dayProgress,
  firstUnfinished,
  itemKeys,
  pendingBefore,
  planDay,
  totalProgress,
  type Phase,
  type ScheduleDay,
  type ScheduleTheme,
} from "@/lib/schedule";
import { useApp, useHydrated } from "@/lib/store";

const PHASE_SHORT: Record<Phase, string> = { A: "Days 1–24", B: "Days 25–48", R: "Sprints 49–54", D: "Days 55–60" };

const CHANCE_STYLE: Record<string, string> = {
  HIGH: "bg-good-soft text-good",
  "MED-HIGH": "bg-primary-soft text-primary",
  MED: "bg-hairline text-muted",
  "LOW-MED": "bg-hairline text-muted",
};

export function MainsScreen() {
  const hydrated = useHydrated();
  const sched = useApp((s) => s.sched);
  const todayKey = dayKey();
  const today = planDay(todayKey);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const total = useMemo(() => totalProgress(DAYS, sched), [sched]);
  const daysDone = useMemo(() => DAYS.filter((d) => dayDone(d, sched)).length, [sched]);
  const behind = useMemo(() => pendingBefore(todayKey, sched), [todayKey, sched]);

  // Open on today's phase and day (or on the start of the plan before it begins).
  useEffect(() => {
    if (!hydrated || phase !== null) return;
    // "/mains#day-12" (from the calendar) opens that day
    const hash = Number(/^#day-(\d+)$/.exec(window.location.hash)?.[1]);
    const linked = DAYS.find((x) => x.day === hash);
    const d = linked ?? today ?? DAYS[0];
    setPhase(d.phase);
    setOpen(d.day);
    // bring today's card into view once the list has rendered
    if (linked || d.day > 3) setTimeout(() => document.getElementById(`day-${d.day}`)?.scrollIntoView({ block: "start" }), 50);
  }, [hydrated, phase, today]);

  if (!hydrated || phase === null) return <PageSkeleton />;

  const shown = DAYS.filter((d) => d.phase === phase);
  const resume = firstUnfinished(sched);
  const pct = total.total ? Math.round((total.done / total.total) * 100) : 0;

  const jump = (d: ScheduleDay) => {
    setPhase(d.phase);
    setOpen(d.day);
    requestAnimationFrame(() => document.getElementById(`day-${d.day}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Group-I Mains checklist</h1>
      <p className="mt-1 text-sm text-muted">
        The 60-day PYQ-recurrence plan, one theme a day. Read that day&apos;s past questions and expected questions in your offline booklet, then tick
        them here — your progress is saved on this device.
      </p>

      <Card className="mt-4 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="font-display text-3xl font-bold tabular">
              {total.done}
              <span className="text-lg font-semibold text-muted"> / {total.total}</span>
            </div>
            <div className="text-xs text-muted">
              items ticked · {daysDone} of {DAYS.length} days complete · {pct}%
            </div>
          </div>
          {resume && (
            <Button size="sm" className="shrink-0 whitespace-nowrap" onClick={() => jump(resume)}>
              {total.done ? "Continue" : "Start"} <ArrowRight size={15} />
            </Button>
          )}
        </div>
        <Bar value={total.done} max={total.total} className="mt-3" />
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            {today
              ? today.date === todayKey
                ? `Today is Day ${today.day} · ${today.label}`
                : `The plan ended on ${today.label}`
              : `The plan starts on ${DAYS[0].label}`}
          </span>
          {today && today.date === todayKey && (
            <button className="font-semibold text-primary" onClick={() => jump(today)}>
              Go to today
            </button>
          )}
          {behind.length > 0 && (
            <button className="font-semibold text-amber-700 dark:text-amber-300" onClick={() => jump(behind[0])}>
              {behind.length} earlier day{behind.length > 1 ? "s" : ""} not finished
            </button>
          )}
        </div>
      </Card>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Phase">
        {PHASE_ORDER.map((p) => {
          const pd = DAYS.filter((d) => d.phase === p);
          const pp = totalProgress(pd, sched);
          return (
            <Chip key={p} on={phase === p} onClick={() => (setPhase(p), setOpen(null))}>
              {PHASE_SHORT[p]} · {pp.done}/{pp.total}
            </Chip>
          );
        })}
      </div>
      <p className="mt-2 text-sm font-semibold">{PHASES[phase]}</p>

      <div className="mt-3 grid gap-3">
        {shown.map((d) => (
          <DayCard
            key={d.day}
            d={d}
            isToday={!!today && d.day === today.day && today.date === todayKey}
            late={d.date < todayKey}
            open={open === d.day}
            onToggle={() => setOpen(open === d.day ? null : d.day)}
          />
        ))}
      </div>
      <p className="mt-5 text-xs text-muted">
        Source: Team Civilians Group-1 Mains theme dossiers (PYQ cycles 2008–2025). Chance ratings are forecasts from the trend, not information about the
        paper.
      </p>
    </div>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-hairline", className)} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

function DayCard({
  d,
  isToday,
  late,
  open,
  onToggle,
}: {
  d: ScheduleDay;
  isToday: boolean;
  late: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const sched = useApp((s) => s.sched);
  const setSched = useApp((s) => s.setSched);
  const p = dayProgress(d, sched);
  const fin = dayDone(d, sched);
  const title = d.themes.length ? d.themes.map((t) => t.title).join(" + ") : "Rewrite sprint";
  return (
    <Card id={`day-${d.day}`} className={cx("scroll-mt-28 overflow-hidden", isToday && "ring-2 ring-primary/50")}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-3 p-4 text-left">
        <span
          className={cx(
            "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold tabular",
            fin ? "bg-good text-white" : "bg-primary-soft text-primary",
          )}
        >
          {fin ? <Check size={17} /> : d.day}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted">
            Day {d.day} · {d.label}
            {isToday && <span className="ml-1.5 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-on-primary">Today</span>}
            {late && !fin && <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Pending</span>}
          </span>
          <span className={cx("mt-0.5 block font-semibold leading-snug", fin && "text-muted line-through decoration-good/70 decoration-2")}>{title}</span>
          <span className="mt-1 block text-xs text-muted tabular">
            {p.done}/{p.total} ticked
            {d.themes.length === 1 && ` · ${d.themes[0].pyqs} past questions · asked in ${d.themes[0].cycles} sittings`}
          </span>
        </span>
        <ChevronDown size={18} className={cx("mt-2 shrink-0 text-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-hairline px-4 pb-4 pt-3">
          {d.themes.length === 0 ? (
            <Rewrite d={d} />
          ) : (
            d.themes.map((t, i) => <Theme key={i} d={d} t={t} i={i} many={d.themes.length > 1} />)
          )}
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant={fin ? "outline" : "soft"} onClick={() => setSched(itemKeys(d), !fin)}>
              {fin ? (
                <>
                  <RotateCcw size={15} /> Clear this day
                </>
              ) : (
                <>
                  <Check size={15} /> Tick the whole day
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Rewrite({ d }: { d: ScheduleDay }) {
  return (
    <div>
      <p className="text-sm text-muted">
        Days 49–54 have no new theme: rewrite sprints. Use the day to rewrite your weakest answers from the earlier themes.
      </p>
      <Item k={`d${d.day}.rw`} className="mt-3">
        <span className="font-medium">Rewrite sprint done</span>
      </Item>
    </div>
  );
}

function Theme({ d, t, i, many }: { d: ScheduleDay; t: ScheduleTheme; i: number; many: boolean }) {
  const sched = useApp((s) => s.sched);
  const reserve = t.more.map((m) => `d${d.day}.t${i}.r${m.n}`);
  const reserveDone = reserve.filter((k) => sched[k]).length;
  const [showMore, setShowMore] = useState(false);
  return (
    <div className={cx(i > 0 && "mt-5 border-t border-hairline pt-4")}>
      {many && <div className="text-sm font-semibold">{t.title}</div>}
      <div className="text-xs text-muted">
        {t.paper} · {t.pyqs} past questions · asked in {t.cycles} sittings
      </div>

      <div className="mt-3 grid gap-2">
        <Item k={`d${d.day}.t${i}.pyq`}>
          <span className="font-medium">Read the {t.pyqs} past questions (PYQ table in the booklet)</span>
        </Item>
        <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-faint">Expected questions · top 5</div>
        {t.top.map((q) => (
          <Item key={q.n} k={`d${d.day}.t${i}.q${q.n}`}>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs font-semibold text-muted">
                {q.n}. {q.topic}
              </span>
              <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", CHANCE_STYLE[q.chance] ?? "bg-hairline text-muted")}>{q.chance}</span>
            </span>
            <span className="mt-0.5 block leading-snug">{q.q}</span>
          </Item>
        ))}
      </div>

      <button onClick={() => setShowMore(!showMore)} aria-expanded={showMore} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ChevronDown size={15} className={cx("transition", showMore && "rotate-180")} />
        Reserve questions 6–12 (optional) · {reserveDone}/{reserve.length}
      </button>
      {showMore && (
        <div className="mt-2 grid gap-2">
          {t.more.map((m) => (
            <Item key={m.n} k={`d${d.day}.t${i}.r${m.n}`}>
              <span className="flex flex-wrap items-center gap-x-2">
                <span className="text-xs font-semibold text-muted">{m.n}.</span>
                <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", CHANCE_STYLE[m.chance] ?? "bg-hairline text-muted")}>{m.chance}</span>
              </span>
              <span className="mt-0.5 block leading-snug">{m.q}</span>
            </Item>
          ))}
        </div>
      )}
    </div>
  );
}

/** One tick-box row; the whole row is the tap target. */
function Item({ k, children, className }: { k: string; children: React.ReactNode; className?: string }) {
  const on = useApp((s) => !!s.sched[k]);
  const toggle = useApp((s) => s.toggleSched);
  return (
    <button
      onClick={() => toggle(k)}
      role="checkbox"
      aria-checked={on}
      className={cx(
        "flex w-full items-start gap-3 rounded-2xl border p-3 text-left text-[15px] transition",
        on ? "border-good/40 bg-good-soft/60" : "border-hairline hover:border-primary/40",
        className,
      )}
    >
      <span className={cx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition", on ? "border-good bg-good text-white" : "border-hairline")}>
        {on && <Check size={14} />}
      </span>
      <span className={cx("min-w-0 flex-1", on && "text-muted line-through decoration-good/70 decoration-2")}>{children}</span>
    </button>
  );
}

"use client";

import { Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import drill from "@/content/drill-60.json";
import { dayProgress, planDay, qKey, streak, type DrillDay, type DrillQ } from "@/lib/drill";
import { dayKey } from "@/lib/random";
import { useApp, useHydrated } from "@/lib/store";
import { Button, Card, Chip, PageSkeleton, SectionTitle, cx } from "@/components/ui";

const DAYS = drill as unknown as DrillDay[];
const ROMAN = ["", "I", "II", "III", "IV", "V"];
const ANSWER_SECONDS = 12 * 60;
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function DrillScreen() {
  const hydrated = useHydrated();
  const drillState = useApp((s) => s.drill);
  const setStart = useApp((s) => s.setDrillStart);
  const toggle = useApp((s) => s.toggleDrillQ);
  const today = dayKey();
  const current = planDay(drillState.start, today);
  const [picked, setPicked] = useState<number | null>(null);
  const [timer, setTimer] = useState({ left: ANSWER_SECONDS, run: false });

  useEffect(() => {
    if (!timer.run) return;
    const id = setInterval(() => setTimer((t) => (t.left <= 1 ? { left: 0, run: false } : { ...t, left: t.left - 1 })), 1000);
    return () => clearInterval(id);
  }, [timer.run]);

  const dayNo = picked ?? current;
  const day = DAYS[dayNo - 1];
  const { done } = drillState;
  const prog = dayProgress(day, done);
  const totals = useMemo(() => {
    let must = 0, all = 0;
    for (const d of DAYS) {
      const p = dayProgress(d, done);
      must += p.done;
      all += p.all;
    }
    return { must, all };
  }, [done]);
  if (!hydrated) return <PageSkeleton />;

  const go = (n: number) => {
    setPicked(Math.min(60, Math.max(1, n)));
    setTimer({ left: ANSWER_SECONDS, run: false });
    window.scrollTo({ top: 0 });
  };
  const must = day.expected.filter((e) => e.tier === "must");
  const stretch = day.expected.filter((e) => e.tier === "stretch");
  const reserve = day.expected.filter((e) => e.tier === "reserve");

  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">60-day drill</h1>
      <p className="mt-1 text-sm text-muted">
        One theme a day. Write the 4 MUST questions in 12 minutes each, then tick them. Stretch and reserve questions are optional extras. These are forecast
        angles not yet asked, not confirmed questions.
      </p>

      <Card className="mt-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-display text-3xl font-bold tabular">
              Day {current}
              <span className="text-lg font-semibold text-muted"> / 60</span>
            </div>
            <div className="text-xs text-muted">
              {totals.must} / {DAYS.length * 4} core answers written · {totals.all} in all · streak {streak(DAYS, done, current)} {streak(DAYS, done, current) === 1 ? "day" : "days"}
            </div>
          </div>
          {drillState.start ? (
            <Button size="sm" variant="outline" onClick={() => confirm("Restart the plan from Day 1 today? Ticks are kept.") && (setStart(dayKey()), setPicked(null))}>
              Restart from today
            </Button>
          ) : (
            <Button size="sm" onClick={() => (setStart(dayKey()), setPicked(null))}>
              Start Day 1 today
            </Button>
          )}
        </div>
        <Bar value={totals.must} max={DAYS.length * 4} className="mt-3" />
      </Card>

      <div className="no-scrollbar mt-4 grid grid-cols-10 gap-1.5" role="group" aria-label="Pick a day">
        {DAYS.map((d) => {
          const p = dayProgress(d, done);
          return (
            <button
              key={d.day}
              onClick={() => go(d.day)}
              aria-label={`Day ${d.day}${p.done === p.total ? ", finished" : ""}`}
              aria-current={d.day === dayNo ? "true" : undefined}
              className={cx(
                "h-8 rounded-lg border text-xs font-semibold tabular transition",
                d.day === dayNo ? "border-primary ring-2 ring-primary/40" : "border-hairline",
                p.done === p.total ? "bg-primary text-on-primary" : p.done ? "bg-primary-soft text-primary" : d.day === current ? "bg-glass text-primary" : "bg-glass text-muted",
              )}
            >
              {d.day}
            </button>
          );
        })}
      </div>

      <SectionTitle
        action={
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => go(dayNo - 1)} disabled={dayNo <= 1} aria-label="Previous day">
              <ChevronLeft size={16} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => go(dayNo + 1)} disabled={dayNo >= 60} aria-label="Next day">
              <ChevronRight size={16} />
            </Button>
          </div>
        }
      >
        Day {day.day} · Paper {ROMAN[day.paper]} · Rank {day.rank}
      </SectionTitle>
      <h2 className="font-display text-xl font-bold">{day.theme}</h2>
      <p className="mt-1 text-sm text-muted">
        {day.recurrence}. Usual slot: {day.slot}.
      </p>
      {day.ab && <p className="mt-2 rounded-2xl bg-primary-soft p-3 text-sm text-primary">{day.ab}</p>}

      <Card className="mt-4 flex items-center justify-between gap-3 p-3">
        <div>
          <div className="font-display text-2xl font-bold tabular">{mmss(timer.left)}</div>
          <div className="text-xs text-muted">{timer.left === 0 ? "Time is up. Stop and tick it." : "12 minutes, about 3 pages, one answer"}</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setTimer((t) => ({ left: t.left === 0 ? ANSWER_SECONDS : t.left, run: !t.run }))}>
            {timer.run ? <Pause size={15} /> : <Play size={15} />} {timer.run ? "Pause" : "Start"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTimer({ left: ANSWER_SECONDS, run: false })} aria-label="Reset timer">
            <RotateCcw size={15} />
          </Button>
        </div>
      </Card>

      <SectionTitle>
        Today&apos;s 4 · {prog.done}/{prog.total}
      </SectionTitle>
      <div className="space-y-2">
        {must.map((e) => (
          <QRow key={e.n} day={day.day} e={e} done={done} onToggle={toggle} />
        ))}
      </div>
      {stretch.length > 0 && (
        <Fold title={`Stretch +${stretch.length} (optional)`}>
          {stretch.map((e) => (
            <QRow key={e.n} day={day.day} e={e} done={done} onToggle={toggle} />
          ))}
        </Fold>
      )}
      {reserve.length > 0 && (
        <Fold title={`Reserve · ${reserve.length} for revision days`}>
          {reserve.map((e) => (
            <QRow key={e.n} day={day.day} e={e} done={done} onToggle={toggle} />
          ))}
        </Fold>
      )}

      <Fold title={`Read first: ${day.reading.length} past questions`}>
        {day.reading.map((r, i) => (
          <Card key={i} className="p-3 text-sm">
            <span className="text-xs font-semibold text-primary">PYQ {r.years}</span>
            <p className="mt-0.5">{r.q}</p>
          </Card>
        ))}
        {day.other && (
          <p className="text-xs text-muted">
            <span className="font-semibold">Other angles asked:</span> {day.other}
          </p>
        )}
      </Fold>
      <p className="mt-6 text-xs text-muted">
        Compare with the model answer only after writing. For current-affairs questions, check the latest data before answering.
      </p>
    </div>
  );
}

function QRow({ day, e, done, onToggle }: { day: number; e: DrillQ; done: Record<string, number>; onToggle: (k: string) => void }) {
  const key = qKey(day, e.n);
  const on = !!done[key];
  return (
    <button
      onClick={() => onToggle(key)}
      aria-pressed={on}
      className={cx("glass flex w-full items-start gap-3 rounded-2xl p-3 text-left transition", on && "opacity-70")}
    >
      <span className={cx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border", on ? "border-primary bg-primary text-on-primary" : "border-hairline")}>
        {on && <Check size={14} />}
      </span>
      <span>
        <span className="block text-xs font-semibold uppercase tracking-wide text-primary">{e.tag}</span>
        <span className={cx("block text-[15px]", on && "line-through")}>{e.q}</span>
      </span>
    </button>
  );
}

function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <Chip on={open} onClick={() => setOpen((o) => !o)}>
        {title}
      </Chip>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-hairline", className)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

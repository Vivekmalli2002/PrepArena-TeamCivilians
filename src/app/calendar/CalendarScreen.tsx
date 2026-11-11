"use client";

import { CalendarClock, Check, Flag } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Card, PageSkeleton, Sheet, cx } from "@/components/ui";
import { dayProgress, itemKeys } from "@/lib/schedule";
import {
  WEEKDAYS,
  buildMonth,
  daysBetween,
  dateDone,
  announced,
  fmtDay,
  monthsToShow,
  notAnnounced,
  planDayOn,
  remaining,
  type Cell,
} from "@/lib/calendar";
import { dayKey } from "@/lib/random";
import { useApp, useHydrated } from "@/lib/store";

export function CalendarScreen() {
  const hydrated = useHydrated();
  const sched = useApp((s) => s.sched);
  const marked = useApp((s) => s.calDone);
  const myExam = useApp((s) => s.profile?.examId);
  const [picked, setPicked] = useState<string | null>(null);
  const today = dayKey();
  const months = useMemo(() => monthsToShow(today).map((m) => buildMonth(m.year, m.month0)), [today]);
  const rem = useMemo(() => remaining(today, sched, marked), [today, sched, marked]);
  if (!hydrated) return <PageSkeleton />;

  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Exam calendar</h1>
      <p className="mt-1 text-sm text-muted">
        Every day from today to the announced exam dates. A day gets a ✅ when its plan day is fully ticked in the Group-I Mains checklist, or when you mark it
        done yourself.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {rem.exams.map(({ exam, daysLeft, passed, freeAfterPlan }) => (
          <Card key={exam.id} className={cx("p-4", exam.examId === myExam && "ring-2 ring-primary/50")}>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted">
              <Flag size={14} /> {exam.name}
              {exam.examId === myExam && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-on-primary">Your exam</span>}
            </div>
            <div className="mt-1 font-display text-4xl font-bold tabular">
              {passed ? "Held" : daysLeft === 0 ? "Today" : daysLeft}
              {!passed && daysLeft > 0 && <span className="ml-1.5 text-base font-semibold text-muted">days to go</span>}
            </div>
            <div className="mt-1 text-sm">{fmtDay(exam.date)}</div>
            {!passed && freeAfterPlan > 0 && <div className="mt-1 text-xs text-muted">{freeAfterPlan} free days after the 60-day plan ends for revision</div>}
          </Card>
        ))}
      </div>

      <Card className="mt-3 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarClock size={16} /> The 60-day Mains plan
        </div>
        <div className="mt-1 text-sm text-muted">
          {!rem.planStarted
            ? `Starts in ${daysBetween(today, rem.planStart)} day${daysBetween(today, rem.planStart) === 1 ? "" : "s"} (${fmtDay(rem.planStart)}).`
            : rem.planOver
              ? `Ended on ${fmtDay(rem.planEnd)}.`
              : rem.planToday
                ? `Today is Day ${rem.planToday.day} of ${60}. ${rem.planDaysLeft} calendar days left including today (ends ${fmtDay(rem.planEnd)}).`
                : ""}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm tabular">
          <span>
            <b>{rem.planDone}</b> day{rem.planDone === 1 ? "" : "s"} done
          </span>
          <span>
            <b>{rem.planAhead}</b> still ahead
          </span>
          <span className={cx(rem.behind.length > 0 && "font-semibold text-amber-700 dark:text-amber-300")}>
            <b>{rem.behind.length}</b> behind
          </span>
        </div>
        {rem.behind.length > 0 && (
          <div className="mt-2 text-xs text-muted">
            Not finished: {rem.behind.slice(0, 6).map((d) => `Day ${d.day} (${d.label})`).join(", ")}
            {rem.behind.length > 6 && ` and ${rem.behind.length - 6} more`}.{" "}
            <Link href={`/mains#day-${rem.behind[0].day}`} className="font-semibold text-primary">
              Open Day {rem.behind[0].day}
            </Link>
          </div>
        )}
        {rem.planToday && (
          <div className="mt-2 text-xs">
            <Link href={`/mains#day-${rem.planToday.day}`} className="font-semibold text-primary">
              Open today&apos;s checklist →
            </Link>
          </div>
        )}
      </Card>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legend">
        <span>✅ day done</span>
        <span>
          <b className="text-primary">G1</b> exam day
        </span>
        <span>
          <span className="inline-block size-2 rounded-full bg-amber-500" /> plan day not finished
        </span>
        <span>D5 = plan day 5</span>
        <span>
          <span className="inline-block size-3 rounded border-2 border-primary align-middle" /> today
        </span>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {months.map((m) => (
          <Card key={m.title} className="p-3 sm:p-4">
            <h2 className="font-display text-lg font-bold">{m.title}</h2>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-faint">
              {WEEKDAYS.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {m.weeks.flat().map((c, i) => (c ? <Day key={c.key} c={c} today={today} onPick={() => setPicked(c.key)} /> : <div key={`pad${i}`} />))}
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-4">
        <h2 className="font-display text-lg font-bold">Dates not announced yet</h2>
        <p className="mt-1 text-sm text-muted">These exams have no date from APPSC yet. They will be added to the calendar as soon as they are announced.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {notAnnounced().map((e) => (
            <span key={e.id} className="rounded-full border border-hairline px-3 py-1 text-sm text-muted">
              {e.name}
            </span>
          ))}
        </div>
      </section>

      <DaySheet date={picked} today={today} onClose={() => setPicked(null)} />
    </div>
  );
}

function Day({ c, today, onPick }: { c: Cell; today: string; onPick: () => void }) {
  const sched = useApp((s) => s.sched);
  const marked = useApp((s) => s.calDone);
  const done = dateDone(c.key, sched, marked);
  const isToday = c.key === today;
  const late = !!c.plan && c.key < today && !done;
  return (
    <button
      onClick={onPick}
      aria-label={`${fmtDay(c.key)}${c.exam ? `, ${c.exam.name}` : ""}${c.plan ? `, plan day ${c.plan.day}` : ""}${done ? ", done" : ""}`}
      className={cx(
        "relative flex aspect-square flex-col items-center justify-between rounded-xl border p-0.5 text-center transition",
        c.exam ? "border-primary bg-primary text-on-primary" : done ? "border-good/40 bg-good-soft/60" : "border-hairline hover:border-primary/40",
        isToday && "ring-2 ring-primary ring-offset-1 ring-offset-transparent",
        c.key < today && !done && !c.exam && "opacity-60",
      )}
    >
      <span className="text-[13px] font-semibold leading-none tabular">{c.day}</span>
      <span className="flex h-4 items-center text-[13px] leading-none">{c.exam ? <b className="text-[10px]">{c.exam.mark}</b> : done ? <span aria-hidden>✅</span> : late ? <span className="size-1.5 rounded-full bg-amber-500" /> : null}</span>
      <span className={cx("text-[9px] leading-none tabular", c.exam ? "opacity-80" : "text-faint")}>{c.plan ? `D${c.plan.day}` : " "}</span>
    </button>
  );
}

function DaySheet({ date, today, onClose }: { date: string | null; today: string; onClose: () => void }) {
  const sched = useApp((s) => s.sched);
  const marked = useApp((s) => s.calDone);
  const toggle = useApp((s) => s.toggleCalDay);
  return (
    <Sheet open={!!date} onClose={onClose} title={date ? fmtDay(date) : ""}>
      {date && <DayDetail date={date} today={today} sched={sched} marked={marked} toggle={toggle} />}
    </Sheet>
  );
}

function DayDetail({
  date,
  today,
  sched,
  marked,
  toggle,
}: {
  date: string;
  today: string;
  sched: Record<string, number>;
  marked: Record<string, number>;
  toggle: (date: string) => void;
}) {
  const plan = planDayOn(date);
  const exam = announced().find((x) => x.date === date);
  const days = exam ? daysBetween(today, date) : 0;
  const done = dateDone(date, sched, marked);
  const auto = !!plan && itemKeys(plan).every((k) => sched[k]);
  const p = plan ? dayProgress(plan, sched) : null;
  const started = date <= today;
  return (
    <>
      {exam && (
        <div className="rounded-2xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary">
          {exam.name} · {days > 0 ? `${days} days to go` : days === 0 ? "today" : "held"}
        </div>
      )}
      {plan ? (
        <div className="mt-3">
          <div className="text-xs font-semibold text-muted">Plan day {plan.day} of 60</div>
          <div className="mt-0.5 font-semibold leading-snug">{plan.themes.length ? plan.themes.map((t) => t.title).join(" + ") : "Rewrite sprint"}</div>
          {p && (
            <div className="mt-1 text-sm text-muted tabular">
              {p.done}/{p.total} items ticked in the checklist
            </div>
          )}
          <Link href={`/mains#day-${plan.day}`} className="mt-1 inline-block text-sm font-semibold text-primary">
            Open this day in the Group-I Mains checklist →
          </Link>
        </div>
      ) : (
        !exam && <p className="mt-1 text-sm text-muted">No plan day on this date{date > today ? " — free for revision and mock tests." : "."}</p>
      )}
      <div className="mt-4">
        {auto ? (
          <p className="rounded-2xl bg-good-soft px-3 py-2 text-sm font-semibold text-good">✅ Done — every item of this plan day is ticked.</p>
        ) : started ? (
          <Button variant={marked[date] ? "outline" : "primary"} className="w-full" onClick={() => toggle(date)}>
            <Check size={17} /> {marked[date] ? "Marked done — tap to undo" : "Mark this day as done"}
          </Button>
        ) : (
          <p className="text-sm text-muted">You can mark a day as done once it has started.</p>
        )}
        {done && !auto && <p className="mt-2 text-xs text-muted">Shown with ✅ on the calendar.</p>}
      </div>
    </>
  );
}

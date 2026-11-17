"use client";

import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button, Card, Segmented, cx } from "@/components/ui";
import { fmtDay, weekdayOf } from "@/lib/calendar";
import { dayKey } from "@/lib/random";
import { useApp } from "@/lib/store";
import {
  BLOCK_KEYS,
  BLOCK_MINUTES,
  MEALS,
  MODE_LABEL,
  PLANS,
  SUBJECTS,
  TT_DATES,
  TT_END,
  TT_START,
  dayStats,
  defaultDate,
  fmtHours,
  fmtTime,
  inRange,
  overall,
  toMin,
  ttKey,
  type Mode,
} from "@/lib/timetable";

const shift = (date: string, by: number) => {
  const i = TT_DATES.indexOf(date);
  return TT_DATES[Math.min(TT_DATES.length - 1, Math.max(0, i + by))];
};

export function TimetableView({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  const tt = useApp((s) => s.tt);
  const early = useApp((s) => s.ttEarly);
  const toggle = useApp((s) => s.toggleTT);
  const setEarly = useApp((s) => s.setTTEarly);
  const today = dayKey();
  const shown = inRange(date) ? date : defaultDate(today);
  const mode: Mode = early[shown] ? "E" : "N";
  const st = dayStats(shown, tt);
  const all = overall(today, tt);
  const started = shown <= today;
  const idx = TT_DATES.indexOf(shown);
  const week = (() => {
    // Monday-first week around the shown date, like the original timetable's header strip.
    const back = (weekdayOf(shown) + 6) % 7;
    return Array.from({ length: 7 }, (_, i) => {
      const k = idx - back + i;
      return k >= 0 && k < TT_DATES.length ? TT_DATES[k] : null;
    });
  })();
  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      {all.state === "before" && (
        <p className="mt-3 rounded-2xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary">
          The timetable starts tomorrow, {fmtDay(TT_START)}, and runs every day until {fmtDay(TT_END)} ({all.days} days). You can look ahead now; ticking opens on each day.
        </p>
      )}
      {all.state === "over" && <p className="mt-3 rounded-2xl bg-good-soft px-3 py-2 text-sm font-semibold text-good">The timetable ended on {fmtDay(TT_END)}.</p>}

      <Card className="mt-3 overflow-hidden p-0">
        <div className="bg-primary px-4 pb-3 pt-4 text-on-primary">
          <div className="flex items-center justify-between gap-2">
            <button aria-label="Previous day" disabled={idx <= 0} onClick={() => setDate(shift(shown, -1))} className="grid size-9 place-items-center rounded-full bg-white/15 disabled:opacity-30">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <h2 className="font-display text-xl font-bold leading-tight">{fmtDay(shown)}</h2>
              <p className="text-xs opacity-85">
                Day {idx + 1} of {all.days} · {shown === today ? "today" : shown < today ? "past" : "upcoming"} · {BLOCK_KEYS.length} study blocks
              </p>
            </div>
            <button aria-label="Next day" disabled={idx >= TT_DATES.length - 1} onClick={() => setDate(shift(shown, 1))} className="grid size-9 place-items-center rounded-full bg-white/15 disabled:opacity-30">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {week.map((k, i) => {
              if (!k) return <div key={`p${i}`} />;
              const s = dayStats(k, tt);
              const on = k === shown;
              return (
                <button
                  key={k}
                  onClick={() => setDate(k)}
                  aria-label={`${fmtDay(k)}${s.complete ? ", all done" : ""}`}
                  className={cx("rounded-xl py-1 text-center text-[11px] transition", on ? "bg-white font-bold text-primary" : "bg-white/15")}
                >
                  {weekdayLabels[i]}
                  <b className="block text-base leading-tight tabular">{Number(k.slice(8))}</b>
                  <span className="block h-4 text-[11px] leading-4">{s.complete ? "✅" : s.done > 0 ? `${s.done}/${s.blocks}` : ""}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <Segmented<Mode>
            label="Day type"
            value={mode}
            onChange={(m) => setEarly(shown, m === "E")}
            options={(["N", "E"] as Mode[]).map((m) => ({
              value: m,
              label: (
                <span className="block leading-tight">
                  {MODE_LABEL[m].title}
                  <small className="block text-[11px] font-medium opacity-70">{MODE_LABEL[m].sub}</small>
                </span>
              ),
            }))}
          />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat value={fmtHours(st.planned)} label="Study planned" />
            <Stat value={MODE_LABEL[mode].window} label="Day window" />
            <Stat value={`${st.done} / ${st.blocks}`} label="Completed" />
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-hairline" role="progressbar" aria-valuenow={Math.round((st.doneMin / st.planned) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress today">
            <div className="h-full rounded-full bg-good transition-all" style={{ width: `${(st.doneMin / st.planned) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted tabular">
            {fmtHours(st.doneMin)} of {fmtHours(st.planned)} ticked{st.complete ? " — day complete ✅" : ""}
          </p>
          {!started && <p className="mt-2 text-xs text-muted">Ticking opens on {fmtDay(shown)}.</p>}
        </div>
      </Card>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>🟪 Study (tap to tick)</span>
        <span>🍽️ Meal / tea</span>
        <span>☕ Short break</span>
      </div>

      <ol className="relative mt-3 space-y-2.5 pl-[68px]">
        <span aria-hidden className="absolute bottom-2 left-[58px] top-2 w-0.5 rounded bg-hairline" />
        {PLANS[mode].map((s, i) => {
          const time = (
            <span className="absolute -left-[68px] top-3 w-[52px] text-right text-[11px] font-bold leading-tight text-muted tabular">
              {fmtTime(s.start).replace(" ", " ")}
            </span>
          );
          if (s.t === "study") {
            const p = SUBJECTS[s.key];
            const k = ttKey(shown, s.key);
            const done = !!tt[k];
            return (
              <li key={i} className="relative">
                {time}
                <button
                  onClick={() => started && toggle(k)}
                  disabled={!started}
                  aria-pressed={done}
                  className={cx("flex w-full items-center gap-3 rounded-2xl p-3.5 text-left text-white shadow-sm transition active:scale-[0.985] disabled:cursor-not-allowed", done && "opacity-60", !started && "opacity-80")}
                  style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)` }}
                >
                  <span className="grid size-6 flex-none place-items-center rounded-lg border-[2.5px] border-white text-sm font-black">{done ? "✓" : ""}</span>
                  <span>
                    <span className={cx("block font-semibold leading-snug", done && "line-through decoration-2")}>
                      {p.icon} {p.name}
                    </span>
                    <small className="text-xs opacity-90">
                      {BLOCK_MINUTES[s.key]} min · {fmtTime(s.start)} – {fmtTime(s.end)}
                    </small>
                  </span>
                </button>
              </li>
            );
          }
          if (s.t === "meal") {
            const m = MEALS[s.key];
            return (
              <li key={i} className="relative">
                {time}
                <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-hairline bg-surface px-3.5 py-2.5">
                  <span className="w-6 text-center text-xl">{m.icon}</span>
                  <span>
                    <span className="block text-sm font-semibold">{m.name}</span>
                    <small className="text-xs text-muted">
                      {fmtTime(s.start)} – {fmtTime(s.end)} · {toMin(s.end) - toMin(s.start)} min{m.note ? ` · ${m.note}` : ""}
                    </small>
                  </span>
                </div>
              </li>
            );
          }
          if (s.t === "break")
            return (
              <li key={i} className="relative">
                {time}
                <p className="px-1 pt-1 text-xs text-faint">
                  ☕ {s.label} ({toMin(s.end) - toMin(s.start)} min)
                </p>
              </li>
            );
          return (
            <li key={i} className="relative">
              {time}
              <p className="rounded-2xl bg-fg px-3.5 py-3 text-sm text-bg">{s.label}</p>
            </li>
          );
        })}
      </ol>

      <Progress today={today} setDate={setDate} />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-hairline p-2">
      <b className="block font-display text-base tabular">{value}</b>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

function Progress({ today, setDate }: { today: string; setDate: (d: string) => void }) {
  const tt = useApp((s) => s.tt);
  const a = overall(today, tt);
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const dueNote = a.state === "before" ? "Starts tomorrow." : a.state === "over" ? "Finished." : `${a.daysLeft} day${a.daysLeft === 1 ? "" : "s"} left including today.`;
  return (
    <Card className="mt-5 p-4">
      <h2 className="font-display text-lg font-bold">Your progress · {fmtDay(TT_START).slice(4, 10)} – {fmtDay(TT_END).slice(4, 10)}</h2>
      <p className="mt-0.5 text-sm text-muted">{dueNote}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat value={`${a.complete} / ${a.days}`} label="Days fully done" />
        <Stat value={fmtHours(a.doneMin)} label={`Studied of ${fmtHours(a.totalMin)}`} />
        <Stat value={`${pct(a.doneMin, a.totalMin)}%`} label="Of the whole plan" />
        <div className="rounded-xl border border-hairline p-2 text-center">
          <b className="flex items-center justify-center gap-1 font-display text-base tabular">
            <Flame size={15} className={a.streak ? "text-amber-500" : "text-faint"} /> {a.streak}
          </b>
          <span className="text-[11px] text-muted">Day streak</span>
        </div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-hairline" role="progressbar" aria-valuenow={pct(a.doneMin, a.totalMin)} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress">
        <div className="h-full rounded-full bg-good transition-all" style={{ width: `${pct(a.doneMin, a.totalMin)}%` }} />
      </div>
      {a.dueMin > 0 && (
        <p className="mt-1 text-xs text-muted tabular">
          Due so far: {fmtHours(a.dueMin)} · ticked {fmtHours(a.doneMin)}
        </p>
      )}

      <h3 className="mt-4 text-sm font-semibold">By subject</h3>
      <ul className="mt-2 space-y-2">
        {BLOCK_KEYS.map((k) => {
          const s = a.bySubject[k];
          return (
            <li key={k}>
              <div className="flex items-baseline justify-between text-sm">
                <span>
                  {SUBJECTS[k].icon} {SUBJECTS[k].name}
                </span>
                <span className="text-xs text-muted tabular">
                  {fmtHours(s.done)} / {fmtHours(s.total)}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-hairline">
                <div className="h-full rounded-full" style={{ width: `${pct(s.done, s.total)}%`, background: SUBJECTS[k].color }} />
              </div>
            </li>
          );
        })}
      </ul>

      {a.behind.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">{a.behind.length} earlier day{a.behind.length === 1 ? "" : "s"} not finished</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {a.behind.slice(0, 40).map((d) => (
              <Button key={d} variant="outline" size="sm" onClick={() => { setDate(d); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                {fmtDay(d).slice(4, 10)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}


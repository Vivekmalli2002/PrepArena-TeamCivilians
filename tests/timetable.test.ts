import { describe, expect, it } from "vitest";
import { makeBackup, parseBackup } from "@/lib/backup";
import {
  BLOCK_KEYS,
  BLOCK_MINUTES,
  DAY_MINUTES,
  PLANS,
  TT_DATES,
  cellStatus,
  dayStats,
  defaultDate,
  fmtHours,
  fmtTime,
  inRange,
  overall,
  toMin,
  ttComplete,
  ttKey,
} from "@/lib/timetable";

const tickDay = (tt: Record<string, number>, date: string, keys = BLOCK_KEYS) => keys.forEach((k) => (tt[ttKey(date, k)] = 1));

describe("daily timetable", () => {
  it("runs every day from 18 Nov 2026 to 31 Dec 2026", () => {
    expect(TT_DATES[0]).toBe("2026-11-18");
    expect(TT_DATES.at(-1)).toBe("2026-12-31");
    expect(TT_DATES.length).toBe(44);
    expect(new Set(TT_DATES).size).toBe(44);
    expect(inRange("2026-11-17")).toBe(false);
    expect(inRange("2026-12-31")).toBe(true);
    expect(inRange("2027-01-01")).toBe(false);
  });
  it("starts on the first day before the timetable begins, and on today while it runs", () => {
    expect(defaultDate("2026-11-17")).toBe("2026-11-18");
    expect(defaultDate("2026-12-05")).toBe("2026-12-05");
    expect(defaultDate("2027-02-01")).toBe("2026-12-31");
  });
  it("both day types carry the same seven study blocks with the same minutes, 12h30 in all", () => {
    for (const mode of ["N", "E"] as const) {
      const study = PLANS[mode].filter((s) => s.t === "study");
      expect(study.map((s) => (s as { key: string }).key).sort()).toEqual([...BLOCK_KEYS].sort());
      for (const s of study) {
        const x = s as { key: (typeof BLOCK_KEYS)[number]; start: string; end: string };
        expect(toMin(x.end) - toMin(x.start), `${mode} ${x.key}`).toBe(BLOCK_MINUTES[x.key]);
      }
    }
    expect(DAY_MINUTES).toBe(750);
    expect(fmtHours(DAY_MINUTES)).toBe("12h 30m");
    expect(fmtTime("13:30")).toBe("1:30 PM");
    expect(fmtTime("05:00")).toBe("5:00 AM");
  });
  it("counts ticked blocks and minutes for a day, and completes it when all seven are ticked", () => {
    const tt: Record<string, number> = {};
    tickDay(tt, "2026-11-18", ["SOM", "CA"]);
    expect(dayStats("2026-11-18", tt)).toMatchObject({ done: 2, doneMin: 180 + 60, complete: false });
    tickDay(tt, "2026-11-18");
    expect(ttComplete("2026-11-18", tt)).toBe(true);
    expect(ttComplete("2026-11-19", tt)).toBe(false);
    expect(ttComplete("2026-11-17", { "2026-11-17.SOM": 1 })).toBe(false);
  });
  it("overall progress: days done, streak, behind days, hours by subject", () => {
    const tt: Record<string, number> = {};
    tickDay(tt, "2026-11-18");
    tickDay(tt, "2026-11-19");
    tickDay(tt, "2026-11-21");
    tickDay(tt, "2026-11-22", ["SOM"]);
    const o = overall("2026-11-22", tt);
    expect(o.state).toBe("running");
    expect(o.begun).toBe(5);
    expect(o.complete).toBe(3);
    expect(o.behind).toEqual(["2026-11-20"]);
    expect(o.streak).toBe(0 + 1); // 21 Nov is finished; today (22) is still open; 20 Nov broke the run
    expect(o.doneMin).toBe(3 * DAY_MINUTES + 180);
    expect(o.bySubject.SOM.done).toBe(4 * 180);
    expect(o.bySubject.SOM.total).toBe(44 * 180);
    expect(overall("2026-11-17", {}).state).toBe("before");
    expect(overall("2026-11-17", {}).daysLeft).toBe(44);
    expect(overall("2027-01-02", {}).state).toBe("over");
  });
  it("the calendar cell shows a day as done only when everything planned for it is done", () => {
    const tt: Record<string, number> = {};
    tickDay(tt, "2026-11-20");
    // 20 Nov is also a Mains plan day: the timetable alone is not enough until the plan day is done too
    expect(cellStatus("2026-11-20", "2026-11-25", {}, {}, tt).done).toBe(false);
    expect(cellStatus("2026-11-20", "2026-11-25", {}, {}, tt).late).toBe(true);
    expect(cellStatus("2026-11-20", "2026-11-25", {}, {}, {}).late).toBe(true);
    expect(cellStatus("2026-11-20", "2026-11-25", {}, { "2026-11-20": 1 }, tt).done).toBe(true);
    expect(cellStatus("2027-01-20", "2027-01-25", {}, {}, {}).applicable).toBe(false);
  });
  it("ticks and day types are part of the backup", () => {
    const tt = { "2026-11-18.SOM": 5 };
    const ttEarly = { "2026-11-19": 6 };
    const text = JSON.stringify(makeBackup({ profile: null, theme: "system", attempts: [], qstats: {}, bookmarks: [], activeDays: [], tt, ttEarly }));
    const back = parseBackup(text);
    expect(back.tt).toEqual(tt);
    expect(back.ttEarly).toEqual(ttEarly);
  });
});

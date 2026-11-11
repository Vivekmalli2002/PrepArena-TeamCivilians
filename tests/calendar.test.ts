import { describe, expect, it } from "vitest";
import { makeBackup, parseBackup } from "@/lib/backup";
import { announced, buildMonth, dateDone, daysBetween, fmtDay, monthsToShow, notAnnounced, planDayOn, remaining, weekdayOf } from "@/lib/calendar";
import { DAYS, itemKeys } from "@/lib/schedule";

describe("exam calendar", () => {
  it("knows the two announced dates (Group-1 Prelims 24 Jan 2027, Group-2 Prelims 21 Feb 2027) and which are still open", () => {
    expect(announced().map((e) => [e.name, e.date])).toEqual([["Group-1 Prelims", "2027-01-24"], ["Group-2 Prelims", "2027-02-21"]]);
    expect(fmtDay("2027-01-24")).toBe("Sun 24 Jan 2027");
    expect(fmtDay("2027-02-21")).toBe("Sun 21 Feb 2027");
    expect(notAnnounced().length).toBeGreaterThanOrEqual(8);
    expect(notAnnounced().every((e) => e.date === null)).toBe(true);
  });
  it("counts days between dates across months and years", () => {
    expect(daysBetween("2026-11-11", "2027-01-24")).toBe(74);
    expect(daysBetween("2026-11-11", "2027-02-21")).toBe(102);
    expect(daysBetween("2027-01-24", "2027-01-24")).toBe(0);
    expect(daysBetween("2027-01-25", "2027-01-24")).toBe(-1);
    expect(weekdayOf("2026-11-11")).toBe(3); // Wednesday
  });
  it("shows the months from today to the last announced exam", () => {
    expect(monthsToShow("2026-11-11").map((m) => `${m.year}-${m.month0 + 1}`)).toEqual(["2026-11", "2026-12", "2027-1", "2027-2"]);
    expect(monthsToShow("2027-03-05")).toEqual([{ year: 2027, month0: 2 }]);
  });
  it("lays the grid out Sunday-first with the exam and plan days on their dates", () => {
    const jan = buildMonth(2027, 0);
    expect(jan.weeks.every((w) => w.length === 7)).toBe(true);
    const cells = jan.weeks.flat().filter(Boolean);
    expect(cells).toHaveLength(31);
    expect(cells.find((c) => c!.key === "2027-01-24")!.exam?.mark).toBe("G1");
    expect(cells.find((c) => c!.key === "2027-01-09")!.plan?.day).toBe(60);
    expect(cells.find((c) => c!.key === "2027-01-10")!.plan).toBeUndefined();
    expect(jan.weeks[0].findIndex((c) => c?.day === 1)).toBe(5); // Fri
    const nov = buildMonth(2026, 10);
    expect(nov.weeks.flat().find((c) => c?.key === "2026-11-11")!.plan?.day).toBe(1);
  });
  it("a day is done when its plan day is fully ticked, or when the learner marked it", () => {
    const d1 = DAYS[0];
    const half = Object.fromEntries(itemKeys(d1).slice(0, 3).map((k) => [k, 1]));
    const all = Object.fromEntries(itemKeys(d1).map((k) => [k, 1]));
    expect(dateDone(d1.date, {}, {})).toBe(false);
    expect(dateDone(d1.date, half, {})).toBe(false);
    expect(dateDone(d1.date, all, {})).toBe(true);
    expect(dateDone(d1.date, {}, { [d1.date]: 1 })).toBe(true);
    expect(dateDone("2027-01-15", {}, { "2027-01-15": 1 })).toBe(true); // a free day marked by hand
    expect(planDayOn("2026-11-12")?.day).toBe(2);
  });
  it("summarises what is left: days to each exam, plan days done, ahead and behind", () => {
    const sched = Object.fromEntries(itemKeys(DAYS[0]).map((k) => [k, 1]));
    const r = remaining("2026-11-13", sched, {});
    expect(r.planToday?.day).toBe(3);
    expect(r.planDone).toBe(1);
    expect(r.behind.map((d) => d.day)).toEqual([2]);
    expect(r.planAhead).toBe(57);
    expect(r.exams.map((e) => [e.exam.id, e.daysLeft])).toEqual([["group1-prelims", 72], ["group2-prelims", 100]]);
    expect(r.exams[0].freeAfterPlan).toBe(14); // 10 Jan … 23 Jan
    expect(remaining("2026-11-01", {}, {}).planStarted).toBe(false);
    expect(remaining("2027-01-10", {}, {}).planOver).toBe(true);
    expect(remaining("2027-02-22", {}, {}).exams.every((e) => e.passed)).toBe(true);
  });
  it("marked days are part of the backup", () => {
    const calDone = { "2026-11-12": 5 };
    const text = JSON.stringify(makeBackup({ profile: null, theme: "system", attempts: [], qstats: {}, bookmarks: [], activeDays: [], calDone }));
    expect(parseBackup(text).calDone).toEqual(calDone);
  });
});

import { describe, expect, it } from "vitest";
import { makeBackup, parseBackup } from "@/lib/backup";
import { DAYS, dayDone, dayProgress, firstUnfinished, itemKeys, pendingBefore, planDay, reserveKeys, totalProgress } from "@/lib/schedule";

describe("Group-I Mains day-wise schedule", () => {
  it("has 60 consecutive days from Wed 11 Nov 2026 with 54+6 themes and rewrite sprints on 49-54", () => {
    expect(DAYS).toHaveLength(60);
    expect(DAYS[0]).toMatchObject({ day: 1, date: "2026-11-11", label: "Wed 11 Nov" });
    expect(DAYS[59]).toMatchObject({ day: 60, date: "2027-01-09" });
    DAYS.forEach((d, i) => expect(d.day).toBe(i + 1));
    expect(DAYS.flatMap((d) => d.themes)).toHaveLength(60);
    expect(DAYS.filter((d) => d.phase === "R").map((d) => d.day)).toEqual([49, 50, 51, 52, 53, 54]);
    expect(DAYS.filter((d) => d.day >= 55).every((d) => d.themes.length === 2)).toBe(true);
    expect(DAYS.filter((d) => d.day <= 48).every((d) => d.themes.length === 1)).toBe(true);
  });
  it("gives every theme 5 expected and 7 reserve questions with chance ratings", () => {
    for (const t of DAYS.flatMap((d) => d.themes)) {
      expect(t.top.map((q) => q.n)).toEqual([1, 2, 3, 4, 5]);
      expect(t.more.map((q) => q.n)).toEqual([6, 7, 8, 9, 10, 11, 12]);
      for (const q of [...t.top, ...t.more]) {
        expect(q.q.length).toBeGreaterThan(20);
        expect(q.chance).toMatch(/^(HIGH|MED-HIGH|MED|LOW-MED)$/);
      }
      expect(t.pyqs).toBeGreaterThan(0);
    }
    expect(DAYS[0].themes[0].top[0].q).toMatch(/Multidimensional Poverty Index/);
  });
  it("counts a day's items (reading the PYQs + five expected questions per theme) and ignores the reserve", () => {
    expect(itemKeys(DAYS[0])).toHaveLength(6);
    expect(itemKeys(DAYS[54])).toHaveLength(12);
    expect(itemKeys(DAYS[48])).toEqual(["d49.rw"]);
    expect(reserveKeys(DAYS[0])).toHaveLength(7);
    const sched = Object.fromEntries(itemKeys(DAYS[0]).slice(0, 4).map((k) => [k, 1]));
    expect(dayProgress(DAYS[0], sched)).toEqual({ done: 4, total: 6 });
    expect(dayDone(DAYS[0], sched)).toBe(false);
    const all = { ...sched, ...Object.fromEntries(itemKeys(DAYS[0]).map((k) => [k, 1])), ...Object.fromEntries(reserveKeys(DAYS[0]).map((k) => [k, 1])) };
    expect(dayDone(DAYS[0], all)).toBe(true);
    expect(totalProgress(DAYS, all).done).toBe(6);
    expect(totalProgress(DAYS, {}).total).toBe(6 * 60 + 6);
  });
  it("finds today's plan day, the first unfinished day and the days left behind", () => {
    expect(planDay("2026-11-10")).toBeNull();
    expect(planDay("2026-11-13")?.day).toBe(3);
    expect(planDay("2027-02-01")?.day).toBe(60);
    const sched = Object.fromEntries(itemKeys(DAYS[0]).map((k) => [k, 1]));
    expect(firstUnfinished(sched)?.day).toBe(2);
    expect(pendingBefore("2026-11-13", sched).map((d) => d.day)).toEqual([2]);
  });
  it("is part of the backup and survives a round trip", () => {
    const sched = { "d1.t0.pyq": 123, "d1.t0.q1": 456 };
    const text = JSON.stringify(
      makeBackup({ profile: null, theme: "system", attempts: [], qstats: {}, bookmarks: [], activeDays: [], sched }),
    );
    expect(parseBackup(text).sched).toEqual(sched);
    const old = JSON.stringify(makeBackup({ profile: null, theme: "system", attempts: [], qstats: {}, bookmarks: [], activeDays: [] }));
    expect(parseBackup(old).sched).toEqual({});
  });
});

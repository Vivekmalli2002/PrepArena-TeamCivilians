import { describe, expect, it } from "vitest";
import { chipText, elapsed, partsLeft, SUGGESTIONS, toneOf } from "@/lib/countdown";
import type { Countdown } from "@/lib/extras";

const T = (at: string, over: Partial<Countdown> = {}): Countdown => ({ id: "x", title: "t", kind: "target", at, createdAt: new Date("2026-11-01T00:00").getTime(), ...over });
const now = new Date("2026-11-01T12:00").getTime();

describe("countdown maths", () => {
  it("splits time left into days, hours, minutes and seconds", () => {
    const p = partsLeft(new Date("2027-01-24T09:00:00").getTime(), new Date("2026-11-01T08:49:30").getTime());
    expect(p).toMatchObject({ days: 84, hours: 0, minutes: 10, seconds: 30 });
    expect(p.ms).toBeGreaterThan(0);
  });
  it("counts overdue time upwards", () => {
    const p = partsLeft(now - (86_400_000 * 2 + 3600_000), now);
    expect(p).toMatchObject({ days: 2, hours: 1 });
    expect(p.ms).toBeLessThan(0);
  });
  it("labels and colours the list chips", () => {
    expect(chipText(T("2027-01-24T09:00"), now)).toBe("83 Days");
    expect(chipText(T("2026-11-02T20:00"), now)).toBe("1 Day");
    expect(chipText(T("2026-11-01T16:00"), now)).toBe("4 h left");
    expect(chipText(T("2026-10-30T12:00"), now)).toBe("Overdue 2 d");
    expect(chipText(T("2026-12-01T09:00", { done: true }), now)).toBe("Done");
    expect(toneOf(T("2026-11-03T09:00"), now)).toBe("urgent");
    expect(toneOf(T("2026-11-10T09:00"), now)).toBe("soon");
    expect(toneOf(T("2027-01-24T09:00"), now)).toBe("ok");
    expect(toneOf(T("2026-10-01T09:00"), now)).toBe("over");
    expect(toneOf(T("2026-10-01T09:00", { done: true }), now)).toBe("done");
  });
  it("tracks how much of the time has passed", () => {
    expect(elapsed(T("2026-11-03T00:00"), new Date("2026-11-02T00:00").getTime())).toBeCloseTo(0.5, 2);
    expect(elapsed(T("2026-11-03T00:00"), new Date("2026-12-02T00:00").getTime())).toBe(1);
  });
  it("only suggests dates printed in the notifications", () => {
    expect(SUGGESTIONS.find((s) => s.title.startsWith("Group-1 Prelims"))!.at).toBe("2027-01-24T09:00");
    expect(SUGGESTIONS.every((s) => s.source.length > 5)).toBe(true);
  });
});

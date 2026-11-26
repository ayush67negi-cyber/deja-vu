import { describe, expect, it } from "vitest";
import { upcomingSundays } from "./data";

describe("upcomingSundays", () => {
  it("returns the requested number of Sundays", () => {
    expect(upcomingSundays(6)).toHaveLength(6);
    expect(upcomingSundays(2)).toHaveLength(2);
  });

  it("only returns actual Sundays in YYYY-MM-DD form", () => {
    for (const s of upcomingSundays(8)) {
      expect(s.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${s.value}T00:00:00Z`).getUTCDay()).toBe(0);
      expect(s.label).toBeTruthy();
    }
  });

  it("returns Sundays strictly after today, each 7 days apart", () => {
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const dates = upcomingSundays(6).map((s) => new Date(`${s.value}T00:00:00Z`).getTime());
    for (const d of dates) expect(d).toBeGreaterThan(todayUtc);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] - dates[i - 1]).toBe(7 * 24 * 60 * 60 * 1000);
    }
  });

  it("is deterministic relative to an explicit 'from' date", () => {
    // 2026-11-26 is a Thursday; the next Sunday is 2026-11-29.
    const [first] = upcomingSundays(1, new Date("2026-11-26T12:00:00Z"));
    expect(first.value).toBe("2026-11-29");
  });

  it("skips to next Sunday when called on a Sunday", () => {
    // 2026-11-29 is a Sunday; strictly-after means 2026-12-06.
    const [first] = upcomingSundays(1, new Date("2026-11-29T12:00:00Z"));
    expect(first.value).toBe("2026-12-06");
  });
});

import { describe, expect, it } from "vitest";
import type { Recommendation } from "./engine";
import { savedSoFar, splitByMark, type Mark } from "./marks";

const mark = (id: string, status: Mark["status"], annualSavings: number, currency = "USD"): Mark => ({
  recommendationId: id,
  status,
  annualSavings,
  currency,
  title: id,
  updatedAt: new Date(),
});

describe("savedSoFar", () => {
  it("adds up savings marked done, not kept ones", () => {
    expect(savedSoFar([mark("a", "done", 1200), mark("b", "keep", 900), mark("c", "done", 300)])).toEqual({ amount: 1500, currency: "USD", count: 2 });
  });
  it("leaves out marks in another currency", () => {
    expect(savedSoFar([mark("a", "done", 1200, "GBP"), mark("b", "done", 300)], "USD")).toEqual({ amount: 300, currency: "USD", count: 1 });
  });
  it("is zero with nothing done", () => {
    expect(savedSoFar([]).amount).toBe(0);
  });
});

describe("splitByMark", () => {
  it("separates open, marked and no-longer-found recommendations", () => {
    const recs = [{ id: "a" }, { id: "b" }] as Recommendation[];
    const split = splitByMark(recs, [mark("b", "done", 10), mark("gone", "done", 5)]);
    expect(split.open.map((r) => r.id)).toEqual(["a"]);
    expect(split.marked.map((m) => m.rec.id)).toEqual(["b"]);
    expect(split.gone.map((m) => m.recommendationId)).toEqual(["gone"]);
  });
});

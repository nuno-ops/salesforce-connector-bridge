import type { Recommendation } from "./engine";

export interface Mark {
  recommendationId: string;
  status: "done" | "keep";
  /** The yearly saving when it was marked. */
  annualSavings: number;
  currency: string;
  title: string;
  updatedAt: Date;
}

/** Yearly savings marked done. Marks in another currency (prices changed since) are left out of the total. */
export function savedSoFar(marks: Mark[], currency?: string): { amount: number; currency: string; count: number } {
  const done = marks.filter((m) => m.status === "done");
  const cur = currency ?? done[0]?.currency ?? "USD";
  const same = done.filter((m) => m.currency === cur);
  return { amount: same.reduce((a, m) => a + m.annualSavings, 0), currency: cur, count: same.length };
}

/**
 * Splits the report's recommendations into the ones still open and the ones the customer marked. A done or kept
 * recommendation that's no longer in the latest scan (the seats are gone) still counts towards "saved so far".
 */
export function splitByMark(recs: Recommendation[], marks: Mark[]) {
  const byId = new Map(marks.map((m) => [m.recommendationId, m]));
  return {
    open: recs.filter((r) => !byId.has(r.id)),
    marked: recs.filter((r) => byId.has(r.id)).map((r) => ({ rec: r, mark: byId.get(r.id)! })),
    gone: marks.filter((m) => !recs.some((r) => r.id === m.recommendationId)),
  };
}

import { describe, expect, it } from "vitest";
import type { Recommendation } from "@/lib/savings/engine";
import { lockedRecommendations } from "./teaser";

const rec = (id: string, category: Recommendation["category"], annualSavings: number, title = id): Recommendation => ({
  id,
  category,
  title,
  detail: "why",
  count: 1,
  annualSavings,
  confidence: "high",
  advisory: false,
});

describe("lockedRecommendations", () => {
  it("merges app savings into one row without app names, where the first one was", () => {
    const rows = lockedRecommendations([
      rec("inactive", "inactive_users", 5000),
      rec("a", "unused_apps", 1200, "Cancel ZeroBounce: no activity for 90+ days"),
      rec("frozen", "frozen_users", 900),
      rec("b", "connected_apps", 300, "Consolidate tools: A, B"),
    ]);
    expect(rows.map((r) => r.id)).toEqual(["inactive", "apps", "frozen"]);
    expect(rows[1]).toMatchObject({ title: "Cancel or cut back 2 paid apps", annualSavings: 1500 });
    expect(JSON.stringify(rows)).not.toContain("ZeroBounce");
  });

  it("leaves lists without app savings alone", () => {
    const list = [rec("inactive", "inactive_users", 5000)];
    expect(lockedRecommendations(list)).toBe(list);
  });
});

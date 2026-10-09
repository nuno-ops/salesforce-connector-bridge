import { describe, expect, it } from "vitest";
import { reviewApps } from "./review";

const capturedAt = "2026-10-01T00:00:00.000Z";
let n = 0;
const token = (appName: string, userId: string, useCount: number, lastUsedDate: string | null) => ({
  id: `t${n++}`,
  appName,
  userId,
  useCount,
  lastUsedDate,
});

describe("reviewApps", () => {
  it("returns an empty review when no app has usage", () => {
    expect(reviewApps({ capturedAt, oauthTokens: [] })).toEqual({
      summary: "No connected apps with recorded usage were found.",
      tools: [],
      overlaps: [],
    });
  });

  it("flags apps unused for 90+ days for removal", () => {
    const { tools } = reviewApps({ capturedAt, oauthTokens: [token("Old Tool", "u1", 50, "2026-05-01T10:00:00.000Z")] });
    expect(tools[0]).toMatchObject({ verdict: "remove", lastUsed: "2026-05-01" });
  });

  it("groups third-party apps doing the same job", () => {
    const review = reviewApps({
      capturedAt,
      oauthTokens: [
        token("DocuSign", "u1", 100, "2026-09-30T00:00:00.000Z"),
        token("PandaDoc", "u2", 40, "2026-09-20T00:00:00.000Z"),
        token("Adobe Acrobat Sign", "u3", 5, "2026-01-01T00:00:00.000Z"),
      ],
    });
    expect(review.overlaps).toEqual([{ category: "E-signature", apps: ["DocuSign", "PandaDoc"] }]);
    expect(review.tools.map((t) => [t.appName, t.verdict])).toEqual([
      ["Adobe Acrobat Sign", "remove"],
      ["DocuSign", "consolidate"],
      ["PandaDoc", "consolidate"],
    ]);
  });

  it("keeps Salesforce's own apps and never counts them as overlapping", () => {
    const review = reviewApps({
      capturedAt,
      oauthTokens: [token("Salesforce Mobile", "u1", 3, "2026-09-30T00:00:00.000Z"), token("Data Loader", "u2", 2, "2026-09-29T00:00:00.000Z")],
    });
    expect(review.overlaps).toEqual([]);
    expect(review.tools.every((t) => t.verdict === "keep")).toBe(true);
  });

  it("asks for a closer look at single-user and unrecognised apps, and suggests native alternatives", () => {
    const review = reviewApps({
      capturedAt,
      oauthTokens: [
        token("Outreach", "u1", 3, "2026-09-30T00:00:00.000Z"),
        token("Acme Internal Sync", "u1", 500, "2026-09-30T00:00:00.000Z"),
        token("Acme Internal Sync", "u2", 500, "2026-09-30T00:00:00.000Z"),
        token("Gong", "u3", 80, "2026-09-30T00:00:00.000Z"),
        token("Gong", "u4", 80, "2026-09-30T00:00:00.000Z"),
      ],
    });
    const byName = Object.fromEntries(review.tools.map((t) => [t.appName, t]));
    expect(byName.Outreach).toMatchObject({ verdict: "review", category: "Sales engagement" });
    expect(byName.Outreach.alternative).toMatch(/Sales Engagement/);
    expect(byName["Acme Internal Sync"]).toMatchObject({ verdict: "review", category: "Unrecognised", users: 2, totalUses: 1000 });
    expect(byName.Gong).toMatchObject({ verdict: "keep", category: "Conversation intelligence" });
    expect(review.summary).toBe("3 connected apps have recorded usage. 2 worth a closer look.");
  });

  it("does not mistake similar names for known apps", () => {
    const { tools } = reviewApps({ capturedAt, oauthTokens: [token("Clarity Planner", "u1", 300, "2026-09-30T00:00:00.000Z"), token("Clarity Planner", "u2", 1, "2026-09-30T00:00:00.000Z")] });
    expect(tools[0].category).toBe("Unrecognised");
  });
});

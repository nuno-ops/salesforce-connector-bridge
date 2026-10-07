import { describe, expect, it } from "vitest";
import type { OrgSnapshot, SnapshotUser } from "@/lib/salesforce/types";
import { computeSavings } from "./engine";
import { defaultPriceBook, type PriceBook } from "./prices";

const NOW = new Date("2026-10-01T00:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

function user(id: string, overrides: Partial<SnapshotUser> = {}): SnapshotUser {
  return {
    id,
    name: `User ${id}`,
    username: `${id}@example.com`,
    email: `${id}@example.com`,
    userType: "Standard",
    profileId: "SALES",
    profileName: "Sales User",
    licenseName: "Salesforce",
    lastLoginDate: daysAgo(1),
    createdDate: daysAgo(400),
    ...overrides,
  };
}

function snapshot(overrides: Partial<OrgSnapshot> = {}): OrgSnapshot {
  return {
    version: 1,
    capturedAt: NOW.toISOString(),
    organization: {
      id: "00D000000000001AAA",
      name: "Acme",
      edition: "Enterprise Edition",
      isSandbox: false,
      instanceUrl: "https://acme.my.salesforce.com",
    },
    users: [],
    objectPermissions: [
      // The "SALES" profile can read Opportunities; "SUPPORT_LITE" has nothing on CRM objects.
      { parentId: "PS_SALES_PROFILE", profileId: "SALES", sobjectType: "Opportunity", read: true, create: true, edit: true, delete: false },
      { parentId: "PS_LITE_PROFILE", profileId: "SUPPORT_LITE", sobjectType: "Case", read: false, create: false, edit: false, delete: false },
      { parentId: "PS_CASE_ACCESS", profileId: null, sobjectType: "Case", read: true, create: false, edit: false, delete: false },
    ],
    permissionSetAssignments: [],
    oauthTokens: [],
    userLicenses: [],
    packageLicenses: [],
    permissionSetLicenses: [],
    storage: { dataMaxMB: 1000, dataRemainingMB: 900, fileMaxMB: 1000, fileRemainingMB: 900 },
    sandboxes: [],
    metrics: { leadsByMonth: [], opportunitiesByMonth: [] },
    warnings: [],
    ...overrides,
  };
}

const prices: PriceBook = defaultPriceBook("Enterprise Edition");

describe("defaultPriceBook", () => {
  it("uses the edition list price", () => {
    expect(defaultPriceBook("Enterprise Edition").fullMonthly).toBe(165);
    expect(defaultPriceBook("Unlimited Edition").fullMonthly).toBe(330);
    expect(defaultPriceBook("Professional Edition").fullMonthly).toBe(100);
    expect(defaultPriceBook("Base Edition").fullMonthly).toBe(25);
    expect(defaultPriceBook("Developer Edition").fullMonthly).toBe(100);
  });
});

describe("computeSavings", () => {
  it("returns zero for a healthy org", () => {
    const result = computeSavings(snapshot({ users: [user("a"), user("b")] }), prices, { now: NOW });
    expect(result.annualSavings).toBe(0);
    expect(result.recommendations).toEqual([]);
  });

  it("flags users who never logged in or are past the inactivity threshold", () => {
    const result = computeSavings(
      snapshot({
        users: [
          user("never", { lastLoginDate: null }),
          user("stale", { lastLoginDate: daysAgo(45) }),
          user("old", { lastLoginDate: daysAgo(200) }),
          user("fresh", { lastLoginDate: daysAgo(3) }),
        ],
      }),
      prices,
      { now: NOW },
    );
    expect(result.users.inactive.map((u) => u.id)).toEqual(["never", "stale", "old"]);
    expect(result.users.inactive.find((u) => u.id === "stale")?.confidence).toBe("medium");
    expect(result.users.inactive.find((u) => u.id === "old")?.confidence).toBe("high");
    expect(result.byCategory.inactive_users).toBe(3 * 165 * 12);
  });

  it("does not flag brand-new users who haven't logged in yet", () => {
    const result = computeSavings(
      snapshot({ users: [user("new", { lastLoginDate: null, createdDate: daysAgo(5) })] }),
      prices,
      { now: NOW },
    );
    expect(result.users.inactive).toEqual([]);
  });

  it("ignores users on licenses it can't price", () => {
    const result = computeSavings(
      snapshot({ users: [user("chatter", { licenseName: "Chatter Free", lastLoginDate: null })] }),
      prices,
      { now: NOW },
    );
    expect(result.annualSavings).toBe(0);
  });

  it("prices inactive Platform users at the Platform price", () => {
    const result = computeSavings(
      snapshot({ users: [user("p", { licenseName: "Salesforce Platform", lastLoginDate: null })] }),
      prices,
      { now: NOW },
    );
    expect(result.byCategory.inactive_users).toBe(25 * 12);
  });

  it("finds integration users and caps savings at the free Integration licenses", () => {
    const tokens = (userId: string) => [
      { id: `${userId}-1`, appName: "MuleSoft", userId, useCount: 5000, lastUsedDate: daysAgo(1) },
      { id: `${userId}-2`, appName: "Zapier", userId, useCount: 10, lastUsedDate: daysAgo(1) },
    ];
    const result = computeSavings(
      snapshot({
        users: [user("i1"), user("i2"), user("human")],
        oauthTokens: [...tokens("i1"), ...tokens("i2"), tokens("human")[0]],
        userLicenses: [{ id: "L1", name: "Salesforce Integration", total: 5, used: 4 }],
      }),
      prices,
      { now: NOW },
    );
    expect(result.users.integration.map((u) => u.id).sort()).toEqual(["i1", "i2"]);
    expect(result.users.integration.filter((u) => u.annualSavings > 0)).toHaveLength(1);
    expect(result.byCategory.integration_users).toBe(165 * 12);
  });

  it("treats integration savings as advisory when no Integration licenses exist", () => {
    const result = computeSavings(
      snapshot({ users: [user("x", { username: "api.user@acme.com" })] }),
      prices,
      { now: NOW },
    );
    const rec = result.recommendations.find((r) => r.category === "integration_users");
    expect(rec?.advisory).toBe(true);
    expect(result.annualSavings).toBe(0);
  });

  it("finds full-license users with no read access to Opportunity, Lead or Case", () => {
    const result = computeSavings(
      snapshot({
        users: [
          user("sales"),
          user("lite", { profileId: "SUPPORT_LITE" }),
          user("lite-with-ps", { profileId: "SUPPORT_LITE" }),
        ],
        permissionSetAssignments: [{ assigneeId: "lite-with-ps", permissionSetId: "PS_CASE_ACCESS" }],
      }),
      prices,
      { now: NOW },
    );
    expect(result.users.platform.map((u) => u.id)).toEqual(["lite"]);
    expect(result.byCategory.platform_licenses).toBe((165 - 25) * 12);
  });

  it("skips platform eligibility when permissions couldn't be read", () => {
    const result = computeSavings(
      snapshot({ users: [user("lite", { profileId: "SUPPORT_LITE" })], objectPermissions: [] }),
      prices,
      { now: NOW },
    );
    expect(result.users.platform).toEqual([]);
    expect(result.notes.join(" ")).toMatch(/Platform license eligibility was skipped/);
  });

  it("puts each user in only one bucket", () => {
    const result = computeSavings(
      snapshot({
        users: [user("dup", { profileId: "SUPPORT_LITE", lastLoginDate: null, username: "integration@acme.com" })],
        userLicenses: [{ id: "L1", name: "Salesforce Integration", total: 5, used: 0 }],
      }),
      prices,
      { now: NOW },
    );
    expect(result.users.inactive).toHaveLength(1);
    expect(result.users.integration).toHaveLength(0);
    expect(result.users.platform).toHaveLength(0);
    expect(result.annualSavings).toBe(165 * 12);
  });

  it("counts unassigned seats", () => {
    const result = computeSavings(
      snapshot({ userLicenses: [{ id: "L", name: "Salesforce", total: 50, used: 45 }] }),
      prices,
      { now: NOW },
    );
    expect(result.byCategory.unused_seats).toBe(5 * 165 * 12);
  });

  it("only prices extra full sandboxes when a sandbox price is known", () => {
    const sandboxes = [
      { name: "uat", licenseType: "FULL", description: null },
      { name: "perf", licenseType: "FULL", description: null },
      { name: "dev", licenseType: "DEVELOPER", description: null },
    ];
    const advisory = computeSavings(snapshot({ sandboxes }), prices, { now: NOW });
    expect(advisory.sandboxes).toEqual({ full: 2, partial: 0, developer: 1, total: 3 });
    expect(advisory.recommendations[0]).toMatchObject({ category: "sandboxes", advisory: true, annualSavings: 0 });

    const priced = computeSavings(snapshot({ sandboxes }), { ...prices, fullSandboxMonthly: 4000 }, { now: NOW });
    expect(priced.byCategory.sandboxes).toBe(4000 * 12);
  });

  it("warns about storage above 75% without inventing a dollar figure", () => {
    const result = computeSavings(
      snapshot({ storage: { dataMaxMB: 1000, dataRemainingMB: 50, fileMaxMB: 1000, fileRemainingMB: 900 } }),
      prices,
      { now: NOW },
    );
    expect(result.recommendations[0]).toMatchObject({
      category: "storage",
      advisory: true,
      annualSavings: 0,
      confidence: "high",
    });
    expect(result.storage?.dataUsedPct).toBeCloseTo(0.95);
  });

  it("uses custom prices", () => {
    const result = computeSavings(
      snapshot({ users: [user("never", { lastLoginDate: null })] }),
      { ...prices, fullMonthly: 120, source: "manual" },
      { now: NOW },
    );
    expect(result.annualSavings).toBe(1440);
    expect(result.monthlySavings).toBe(120);
  });

  it("sorts recommendations by savings", () => {
    const result = computeSavings(
      snapshot({
        users: [user("never", { lastLoginDate: null })],
        userLicenses: [{ id: "L", name: "Salesforce", total: 20, used: 10 }],
        packageLicenses: [{ id: "P", namespace: "dsfs", status: "Active", allowed: 10, used: 2 }],
      }),
      prices,
      { now: NOW },
    );
    expect(result.recommendations.map((r) => r.category)).toEqual([
      "unused_seats",
      "inactive_users",
      "package_licenses",
    ]);
  });
});

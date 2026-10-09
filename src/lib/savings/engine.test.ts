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

describe("view-only users", () => {
  const activity = (byUser: Record<string, number>) => ({ objects: ["Account", "Opportunity"], byUser, windowDays: 90 });

  it("flags full-license users who log in but never create or edit records", () => {
    const result = computeSavings(
      snapshot({
        users: [
          user("busy"),
          user("viewer"),
          user("admin", { profileName: "System Administrator" }),
          user("newbie", { createdDate: daysAgo(20) }),
          user("platform", { licenseName: "Salesforce Platform" }),
          user("gone", { lastLoginDate: null }),
        ],
        writeActivity: activity({ busy: 12 }),
      }),
      prices,
      { now: NOW },
    );
    expect(result.users.viewOnly.map((u) => u.id)).toEqual(["viewer"]);
    expect(result.users.inactive.map((u) => u.id)).toEqual(["gone"]);
    expect(result.byCategory.view_only_users).toBe((165 - 25) * 12);
    expect(result.recommendations.find((r) => r.category === "view_only_users")).toMatchObject({ confidence: "low", advisory: false });
  });

  it("skips the check, with a note, when activity wasn't collected", () => {
    const missing = computeSavings(snapshot({ users: [user("viewer")] }), prices, { now: NOW });
    expect(missing.users.viewOnly).toEqual([]);
    expect(missing.notes.some((n) => n.includes("new scan"))).toBe(true);

    const unreadable = computeSavings(snapshot({ users: [user("viewer")], writeActivity: null }), prices, { now: NOW });
    expect(unreadable.users.viewOnly).toEqual([]);
    expect(unreadable.notes.some((n) => n.includes("wasn't readable"))).toBe(true);
  });
});

describe("installed apps", () => {
  const obj = (apiName: string, lastModified: string | null, unreadable = false) => ({
    apiName,
    label: apiName,
    lastCreated: lastModified,
    lastModified,
    unreadable,
  });

  it("marks apps idle when none of their objects changed in 90 days", () => {
    const result = computeSavings(
      snapshot({
        packageLicenses: [{ id: "P", namespace: "old", status: "Active", allowed: 10, used: 10 }],
        installedPackages: [
          { namespace: "busy", name: "Busy App", truncated: false, objects: [obj("busy__A__c", daysAgo(200)), obj("busy__B__c", daysAgo(3))] },
          { namespace: "old", name: "Old App", truncated: false, objects: [obj("old__A__c", daysAgo(200)), obj("old__B__c", null)] },
          { namespace: "empty", name: "Empty App", truncated: false, objects: [obj("empty__A__c", null)] },
          { namespace: "code", name: "Code Only", truncated: false, objects: [] },
          { namespace: "locked", name: "Locked", truncated: false, objects: [obj("locked__A__c", null, true)] },
        ],
      }),
      prices,
      { now: NOW },
    );
    expect(result.apps?.map((a) => [a.name, a.status])).toEqual([
      ["Empty App", "idle"],
      ["Old App", "idle"],
      ["Code Only", "unknown"],
      ["Locked", "unknown"],
      ["Busy App", "active"],
    ]);
    expect(result.apps?.find((a) => a.name === "Old App")).toMatchObject({ seats: { allowed: 10, used: 10 }, lastActivity: daysAgo(200) });
    const recs = result.recommendations.filter((r) => r.category === "unused_apps");
    expect(recs.map((r) => [r.id, r.confidence])).toEqual([
      ["unused_apps:old", "medium"],
      ["unused_apps:empty", "low"],
    ]);
    expect(recs.every((r) => r.advisory && r.annualSavings === 0)).toBe(true);
    expect(result.annualSavings).toBe(0);
  });

  it("leaves apps empty when packages weren't collected", () => {
    expect(computeSavings(snapshot(), prices, { now: NOW }).apps).toBeNull();
    const unreadable = computeSavings(snapshot({ installedPackages: null }), prices, { now: NOW });
    expect(unreadable.apps).toBeNull();
    expect(unreadable.notes.some((n) => n.includes("Installed apps"))).toBe(true);
  });
});

describe("app prices", () => {
  const obj = (lastModified: string | null) => ({ apiName: "x__A__c", label: "A", lastCreated: lastModified, lastModified, unreadable: false });
  const priced = (apps: NonNullable<PriceBook["apps"]>): PriceBook => ({ ...prices, apps });
  const token = (appName: string, userId: string, lastUsed: number, useCount = 50) => ({
    id: `${appName}-${userId}`,
    appName,
    userId,
    useCount,
    lastUsedDate: daysAgo(lastUsed),
  });

  it("prices an idle package by its seats, without counting its unused seats again", () => {
    const result = computeSavings(
      snapshot({
        packageLicenses: [
          { id: "P1", namespace: "old", status: "Active", allowed: 10, used: 4 },
          { id: "P2", namespace: "busy", status: "Active", allowed: 20, used: 15 },
        ],
        installedPackages: [
          { namespace: "old", name: "Old App", truncated: false, objects: [obj(daysAgo(200))] },
          { namespace: "busy", name: "Busy App", truncated: false, objects: [obj(daysAgo(2))] },
          { namespace: "flat", name: "Flat App", truncated: false, objects: [obj(null)] },
        ],
      }),
      priced({ packages: { old: 30, busy: 10, flat: 100 }, connectedApps: {} }),
      { now: NOW },
    );
    // Idle with seats: 10 seats × $30 × 12. Idle without seats: $100 a month × 12.
    expect(result.apps?.map((a) => [a.name, a.annualSavings])).toEqual([
      ["Old App", 3600],
      ["Flat App", 1200],
      ["Busy App", 0],
    ]);
    const ids = result.recommendations.map((r) => [r.id, r.annualSavings, r.advisory]);
    expect(ids).toContainEqual(["unused_apps:old", 3600, false]);
    expect(ids).toContainEqual(["unused_apps:flat", 1200, false]);
    // Busy App's 5 unused seats × $10 × 12; Old App's seats are already covered by cancelling it.
    expect(ids).toContainEqual(["package_licenses:busy", 600, false]);
    expect(ids.some(([id]) => id === "package_licenses:old")).toBe(false);
    expect(result.byCategory.unused_apps).toBe(4800);
    expect(result.byCategory.package_licenses).toBe(600);
  });

  it("prices unused connected apps and the smaller app in an overlap", () => {
    const result = computeSavings(
      snapshot({
        oauthTokens: [
          token("Clearbit", "u1", 200),
          token("Outreach", "u1", 1),
          token("Outreach", "u2", 1),
          token("Salesloft", "u3", 1),
          token("Gong", "u4", 300),
        ],
      }),
      priced({ packages: {}, connectedApps: { Clearbit: 250, Outreach: 900, Salesloft: 400 } }),
      { now: NOW },
    );
    expect(result.connectedApps?.map((a) => [a.appName, a.annualSavings])).toEqual([
      ["Salesloft", 4800],
      ["Clearbit", 3000],
      ["Gong", 0],
      ["Outreach", 0],
    ]);
    const recs = result.recommendations.filter((r) => r.category === "connected_apps");
    expect(recs.map((r) => [r.id, r.annualSavings, r.advisory])).toEqual([
      ["connected_apps:overlap:Sales engagement", 4800, false],
      ["connected_apps:Clearbit", 3000, false],
      // Gong has no price, so it stays as advice.
      ["connected_apps:Gong", 0, true],
    ]);
    expect(result.byCategory.connected_apps).toBe(7800);
  });

  it("keeps unpriced apps as advice with no dollar figure", () => {
    const result = computeSavings(
      snapshot({
        oauthTokens: [token("Clearbit", "u1", 200)],
        packageLicenses: [{ id: "P", namespace: "old", status: "Active", allowed: 10, used: 2 }],
        installedPackages: [{ namespace: "old", name: "Old App", truncated: false, objects: [obj(daysAgo(200))] }],
      }),
      prices,
      { now: NOW },
    );
    const apps = result.recommendations.filter((r) => ["connected_apps", "unused_apps", "package_licenses"].includes(r.category));
    expect(apps).toHaveLength(3);
    expect(apps.every((r) => r.advisory && r.annualSavings === 0)).toBe(true);
    expect(result.annualSavings).toBe(0);
  });

  it("never prices Salesforce's own apps", () => {
    const result = computeSavings(
      snapshot({ oauthTokens: [token("Salesforce Chatter", "u1", 200)] }),
      priced({ packages: {}, connectedApps: { "Salesforce Chatter": 50 } }),
      { now: NOW },
    );
    expect(result.connectedApps?.[0]).toMatchObject({ salesforce: true, verdict: "remove", annualSavings: 0 });
    const rec = result.recommendations.find((r) => r.category === "connected_apps");
    expect(rec).toMatchObject({ title: "Revoke unused access: Salesforce Chatter", advisory: true, annualSavings: 0 });
    expect(rec?.detail).not.toContain("price");
  });
});

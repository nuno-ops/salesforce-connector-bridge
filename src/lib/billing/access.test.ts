import { describe, expect, it } from "vitest";
import { auditPurchaseUpdate, reportUnlocked, resolveAccess, subscriptionUpdate, type EntitlementState } from "./access";
import { licensedUsers, unlockTier, tierLabel } from "./pricing";

const now = new Date("2026-10-01T12:00:00Z");
const hours = (h: number) => new Date(now.getTime() + h * 3_600_000);
const free: EntitlementState = { plan: "free", subscriptionStatus: null, currentPeriodEnd: null, auditAccessUntil: null };

describe("resolveAccess", () => {
  it("gives everyone the full report while billing is off", () => {
    expect(resolveAccess(free, { billingEnabled: false, now })).toMatchObject({ plan: "free", fullReport: true, monitoring: false });
    expect(resolveAccess(null, { billingEnabled: false, now }).fullReport).toBe(true);
  });

  it("limits free workspaces to the summary when billing is on", () => {
    expect(resolveAccess(free, { billingEnabled: true, now })).toMatchObject({ fullReport: false, monitoring: false });
  });

  it("unlocks the report during an audit window only", () => {
    const active = { ...free, plan: "audit" as const, auditAccessUntil: hours(5) };
    expect(resolveAccess(active, { billingEnabled: true, now })).toMatchObject({ plan: "audit", fullReport: true, monitoring: false });
    const expired = { ...active, auditAccessUntil: hours(-1) };
    expect(resolveAccess(expired, { billingEnabled: true, now })).toMatchObject({ plan: "free", fullReport: false });
  });

  it("gives monitoring to live subscriptions", () => {
    const sub = { ...free, plan: "monitor" as const, subscriptionStatus: "active", currentPeriodEnd: hours(24 * 20) };
    expect(resolveAccess(sub, { billingEnabled: true, now })).toMatchObject({ plan: "monitor", fullReport: true, monitoring: true });
    expect(resolveAccess({ ...sub, subscriptionStatus: "canceled" }, { billingEnabled: true, now }).monitoring).toBe(false);
  });
});

describe("subscriptionUpdate", () => {
  it("moves to monitor on an active subscription", () => {
    expect(subscriptionUpdate(free, { id: "sub_1", status: "active", currentPeriodEnd: hours(720) }, now).plan).toBe("monitor");
  });

  it("falls back to a still-valid audit when the subscription ends", () => {
    const state = { ...free, plan: "monitor" as const, auditAccessUntil: hours(3) };
    expect(subscriptionUpdate(state, { id: "sub_1", status: "canceled", currentPeriodEnd: null }, now).plan).toBe("audit");
    expect(subscriptionUpdate(free, { id: "sub_1", status: "canceled", currentPeriodEnd: null }, now).plan).toBe("free");
  });
});

describe("auditPurchaseUpdate", () => {
  it("starts a new window from now", () => {
    expect(auditPurchaseUpdate(free, 48, 50, now)).toEqual({ auditAccessUntil: hours(48), auditUserLimit: 50, plan: "audit" });
  });

  it("extends a running window and never downgrades a subscriber", () => {
    const state = { ...free, plan: "monitor" as const, auditAccessUntil: hours(10), auditUserLimit: 30 };
    expect(auditPurchaseUpdate(state, 48, 50, now)).toEqual({ auditAccessUntil: hours(58), auditUserLimit: 50, plan: "monitor" });
  });

  it("keeps the larger org size while a window runs, and forgets an expired one", () => {
    const running = { ...free, plan: "audit" as const, auditAccessUntil: hours(10), auditUserLimit: 250 };
    expect(auditPurchaseUpdate(running, 48, 50, now).auditUserLimit).toBe(250);
    expect(auditPurchaseUpdate({ ...running, auditUserLimit: null }, 48, 50, now).auditUserLimit).toBeNull();
    expect(auditPurchaseUpdate({ ...running, auditAccessUntil: hours(-1) }, 48, 50, now).auditUserLimit).toBe(50);
  });
});

describe("billing preview", () => {
  it("shows one workspace the paywall while billing is off", () => {
    const preview = { ...free, billingPreview: true };
    expect(resolveAccess(preview, { billingEnabled: false, now })).toMatchObject({ billingEnabled: true, preview: true, fullReport: false });
    expect(resolveAccess(free, { billingEnabled: false, now })).toMatchObject({ billingEnabled: false, preview: false });
  });

  it("is a no-op once billing is really on", () => {
    expect(resolveAccess({ ...free, billingPreview: true }, { billingEnabled: true, now }).preview).toBe(false);
  });
});

describe("reportUnlocked", () => {
  const org = { users: 120, annualSavings: 20_000, price: 590 };
  const on = (state: EntitlementState) => resolveAccess(state, { billingEnabled: true, now });

  it("is open while billing is off and locked for a free workspace", () => {
    expect(reportUnlocked(resolveAccess(free, { billingEnabled: false, now }), org)).toBe(true);
    expect(reportUnlocked(on(free), org)).toBe(false);
  });

  it("is free when the savings found are below the price", () => {
    expect(reportUnlocked(on(free), { ...org, annualSavings: 400 })).toBe(true);
  });

  it("opens orgs up to the size paid for", () => {
    const paid = { ...free, plan: "audit" as const, auditAccessUntil: hours(5), auditUserLimit: 250 };
    expect(reportUnlocked(on(paid), org)).toBe(true);
    expect(reportUnlocked(on({ ...paid, auditUserLimit: 50 }), org)).toBe(false);
    expect(reportUnlocked(on({ ...paid, auditUserLimit: null }), { ...org, users: 5000 })).toBe(true);
  });
});

describe("pricing", () => {
  it("prices by licensed users", () => {
    expect(unlockTier(50).price).toBe(290);
    expect(unlockTier(51).price).toBe(590);
    expect(unlockTier(250).price).toBe(590);
    expect(unlockTier(251).price).toBe(990);
    expect(tierLabel(unlockTier(100))).toBe("51 to 250 users");
    expect(tierLabel(unlockTier(900))).toBe("over 250 users");
  });

  it("counts only internal users", () => {
    const user = (userType: string) => ({ userType }) as never;
    expect(licensedUsers({ users: [user("Standard"), user("Standard"), user("PowerPartner"), user("CspLitePortal")] })).toBe(2);
  });
});

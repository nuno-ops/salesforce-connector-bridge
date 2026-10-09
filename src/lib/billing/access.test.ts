import { describe, expect, it } from "vitest";
import { auditPurchaseUpdate, resolveAccess, subscriptionUpdate, type EntitlementState } from "./access";

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
    expect(auditPurchaseUpdate(free, 48, now)).toEqual({ auditAccessUntil: hours(48), plan: "audit" });
  });

  it("extends a running window and never downgrades a subscriber", () => {
    const state = { ...free, plan: "monitor" as const, auditAccessUntil: hours(10) };
    expect(auditPurchaseUpdate(state, 48, now)).toEqual({ auditAccessUntil: hours(58), plan: "monitor" });
  });
});

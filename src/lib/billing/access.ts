export type Plan = "free" | "audit" | "monitor";

export interface EntitlementState {
  plan: Plan;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
  auditAccessUntil: Date | null;
  /** Largest org (in licensed users) the unlock covers; `null` covers any size. */
  auditUserLimit?: number | null;
}

export interface Access {
  plan: Plan;
  /** Paid for the full report: a subscription, or an unlock window. Use `reportUnlocked` per org. */
  fullReport: boolean;
  /** Weekly automatic rescans and savings history. */
  monitoring: boolean;
  auditAccessUntil: Date | null;
  auditUserLimit: number | null;
  /** When false, nothing is for sale and paid upsells are hidden. */
  billingEnabled: boolean;
}

const LIVE_SUBSCRIPTION = new Set(["active", "trialing", "past_due"]);

/** What a workspace can see. With billing switched off everyone gets the full report, as today. */
export function resolveAccess(
  state: EntitlementState | null,
  { billingEnabled, now = new Date() }: { billingEnabled: boolean; now?: Date },
): Access {
  const monitor =
    state?.plan === "monitor" &&
    LIVE_SUBSCRIPTION.has(state.subscriptionStatus ?? "") &&
    (!state.currentPeriodEnd || state.currentPeriodEnd > now);
  const audit = Boolean(state?.auditAccessUntil && state.auditAccessUntil > now);
  const plan: Plan = monitor ? "monitor" : audit ? "audit" : "free";
  return {
    plan,
    fullReport: !billingEnabled || monitor || audit,
    monitoring: monitor,
    auditAccessUntil: audit ? state!.auditAccessUntil : null,
    auditUserLimit: audit ? (state!.auditUserLimit ?? null) : null,
    billingEnabled,
  };
}

/**
 * Whether one org's full report is open: billing off, a subscription, an unlock that covers
 * an org this size, or the savings found are below the unlock price (then it's free).
 */
export function reportUnlocked(access: Access, org: { users: number; annualSavings: number; price: number }): boolean {
  if (!access.billingEnabled || access.monitoring) return true;
  if (org.annualSavings < org.price) return true;
  return access.plan === "audit" && (access.auditUserLimit === null || org.users <= access.auditUserLimit);
}

/** Entitlement fields to write when a subscription changes. */
export function subscriptionUpdate(
  current: EntitlementState | null,
  sub: { id: string; status: string; currentPeriodEnd: Date | null },
  now = new Date(),
) {
  const live = LIVE_SUBSCRIPTION.has(sub.status);
  const auditStillValid = Boolean(current?.auditAccessUntil && current.auditAccessUntil > now);
  return {
    stripeSubscriptionId: sub.id,
    subscriptionStatus: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    plan: (live ? "monitor" : auditStillValid ? "audit" : "free") as Plan,
  };
}

/**
 * Entitlement fields to write after a one-off unlock. Extends any remaining window and keeps
 * the larger org size of the two (`null` = any size).
 */
export function auditPurchaseUpdate(current: EntitlementState | null, hours: number, userLimit: number | null, now = new Date()) {
  const valid = Boolean(current?.auditAccessUntil && current.auditAccessUntil > now);
  const start = valid ? current!.auditAccessUntil! : now;
  const previous = valid ? (current!.auditUserLimit ?? null) : undefined;
  return {
    auditAccessUntil: new Date(start.getTime() + hours * 3_600_000),
    auditUserLimit: previous === null || userLimit === null ? null : Math.max(previous ?? 0, userLimit),
    // A live subscription outranks an audit.
    plan: (current?.plan === "monitor" ? "monitor" : "audit") as Plan,
  };
}

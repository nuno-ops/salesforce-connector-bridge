export type Plan = "free" | "audit" | "monitor";

export interface EntitlementState {
  plan: Plan;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
  auditAccessUntil: Date | null;
}

export interface Access {
  plan: Plan;
  /** User-level detail, CSV export, printable report and AI tool review. */
  fullReport: boolean;
  /** Weekly automatic rescans and savings history. */
  monitoring: boolean;
  auditAccessUntil: Date | null;
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
    billingEnabled,
  };
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

/** Entitlement fields to write after a one-off audit payment. Extends any remaining window. */
export function auditPurchaseUpdate(current: EntitlementState | null, hours: number, now = new Date()) {
  const start = current?.auditAccessUntil && current.auditAccessUntil > now ? current.auditAccessUntil : now;
  return {
    auditAccessUntil: new Date(start.getTime() + hours * 3_600_000),
    // A live subscription outranks an audit.
    plan: (current?.plan === "monitor" ? "monitor" : "audit") as Plan,
  };
}

import "server-only";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { auditPurchaseUpdate, reportUnlocked, resolveAccess, subscriptionUpdate, type Access, type EntitlementState } from "./access";
import type { OrgSnapshot } from "@/lib/salesforce/types";
import { licensedUsers, tierLabel, unlockTier } from "./pricing";

export type Product = "monitor" | "audit" | "consult";

let client: Stripe | undefined;

/** Lazily created so builds don't need the secret key. */
export function stripe(): Stripe {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}

export function priceFor(product: Exclude<Product, "audit">): string {
  const e = env();
  const price = { monitor: e.STRIPE_PRICE_MONITOR, consult: e.STRIPE_PRICE_CONSULT }[product];
  if (!price) throw new Error(`No Stripe price configured for ${product}`);
  return price;
}

export function accessDays(hours: number): string {
  return hours < 72 ? `${hours} hours` : `${Math.round(hours / 24)} days`;
}

/** The full-report unlock is priced by org size in code, so it needs no Stripe price ids. */
function unlockLineItem(users: number): Stripe.Checkout.SessionCreateParams.LineItem {
  const tier = unlockTier(users);
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: tier.price * 100,
      product_data: {
        name: `Salesforce Saver full report (${tierLabel(tier)})`,
        description: `${accessDays(env().AUDIT_ACCESS_HOURS)} of full access with rescans.`,
      },
    },
  };
}

async function entitlementRow(workspaceId: string) {
  const [row] = await db().select().from(schema.entitlements).where(eq(schema.entitlements.workspaceId, workspaceId)).limit(1);
  return row ?? null;
}

export async function getAccess(workspaceId: string): Promise<Access> {
  return resolveAccess(await entitlementRow(workspaceId), { billingEnabled: env().BILLING_ENABLED });
}

/** Whether this org's full report is open for the workspace. */
export async function orgUnlocked(workspaceId: string, scan: { snapshot: OrgSnapshot | null; annualSavings: number | null }) {
  const access = await getAccess(workspaceId);
  const users = scan.snapshot ? licensedUsers(scan.snapshot) : 0;
  return reportUnlocked(access, { users, annualSavings: scan.annualSavings ?? 0, price: unlockTier(users).price });
}

async function ensureCustomer(workspaceId: string, email: string): Promise<string> {
  const row = await entitlementRow(workspaceId);
  if (row?.stripeCustomerId) return row.stripeCustomerId;
  const customer = await stripe().customers.create({ email, metadata: { workspaceId } });
  await db()
    .insert(schema.entitlements)
    .values({ workspaceId, stripeCustomerId: customer.id })
    .onConflictDoUpdate({ target: schema.entitlements.workspaceId, set: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckout(params: {
  product: Product;
  workspaceId: string;
  userId: string;
  email: string;
  returnPath: string;
  /** Licensed users in the org being unlocked; required for the audit product. */
  users?: number;
}): Promise<string> {
  const appUrl = env().NEXT_PUBLIC_APP_URL;
  const customer = await ensureCustomer(params.workspaceId, params.email);
  if (params.product === "audit" && params.users === undefined) throw new Error("Unlocking needs the org's user count");
  const tier = params.product === "audit" ? unlockTier(params.users!) : null;
  const metadata = {
    workspaceId: params.workspaceId,
    userId: params.userId,
    product: params.product,
    ...(tier ? { userLimit: tier.maxUsers === null ? "any" : String(tier.maxUsers) } : {}),
  };
  const session = await stripe().checkout.sessions.create({
    mode: params.product === "monitor" ? "subscription" : "payment",
    customer,
    line_items: [params.product === "audit" ? unlockLineItem(params.users!) : { price: priceFor(params.product), quantity: 1 }],
    metadata,
    ...(params.product === "monitor" ? { subscription_data: { metadata } } : {}),
    success_url: `${appUrl}${params.returnPath}${params.returnPath.includes("?") ? "&" : "?"}checkout=success`,
    cancel_url: `${appUrl}${params.returnPath}`,
    allow_promotion_codes: true,
  });
  if (params.product === "consult") {
    await db().insert(schema.consultations).values({
      workspaceId: params.workspaceId,
      userId: params.userId,
      stripeSessionId: session.id,
    });
  }
  if (!session.url) throw new Error("Stripe didn't return a checkout URL");
  return session.url;
}

export async function createPortal(workspaceId: string): Promise<string | null> {
  const row = await entitlementRow(workspaceId);
  if (!row?.stripeCustomerId) return null;
  const session = await stripe().billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${env().NEXT_PUBLIC_APP_URL}/settings`,
  });
  return session.url;
}

function toState(row: Awaited<ReturnType<typeof entitlementRow>>): EntitlementState | null {
  return row
    ? {
        plan: row.plan,
        subscriptionStatus: row.subscriptionStatus,
        currentPeriodEnd: row.currentPeriodEnd,
        auditAccessUntil: row.auditAccessUntil,
        auditUserLimit: row.auditUserLimit,
        billingPreview: row.billingPreview,
      }
    : null;
}

async function applySubscription(sub: Stripe.Subscription) {
  const workspaceId = sub.metadata.workspaceId;
  if (!workspaceId) return;
  const periodEnd = sub.items.data.reduce<number | null>(
    (max, item) => (max === null || item.current_period_end > max ? item.current_period_end : max),
    null,
  );
  const update = subscriptionUpdate(toState(await entitlementRow(workspaceId)), {
    id: sub.id,
    status: sub.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  });
  await db()
    .insert(schema.entitlements)
    .values({ workspaceId, ...update })
    .onConflictDoUpdate({ target: schema.entitlements.workspaceId, set: update });
}

/** Preview only: grants the unlock a paid checkout would, without Stripe. */
export async function previewUnlock(workspaceId: string, users: number) {
  const tier = unlockTier(users);
  const update = auditPurchaseUpdate(toState(await entitlementRow(workspaceId)), env().AUDIT_ACCESS_HOURS, tier.maxUsers);
  await db().update(schema.entitlements).set(update).where(eq(schema.entitlements.workspaceId, workspaceId));
}

/** Preview only: locks the report again so the unlock can be tried again. */
export async function previewRelock(workspaceId: string) {
  await db()
    .update(schema.entitlements)
    .set({ auditAccessUntil: null, auditUserLimit: null, plan: "free" })
    .where(and(eq(schema.entitlements.workspaceId, workspaceId), eq(schema.entitlements.billingPreview, true)));
}

async function applyCheckout(session: Stripe.Checkout.Session) {
  const { workspaceId, product, userLimit } = session.metadata ?? {};
  if (!workspaceId) return;
  if (product === "audit" && session.payment_status === "paid") {
    // Older checkouts carry no size: they cover any org.
    const limit = userLimit && userLimit !== "any" ? Number(userLimit) : null;
    const update = auditPurchaseUpdate(toState(await entitlementRow(workspaceId)), env().AUDIT_ACCESS_HOURS, limit);
    await db()
      .insert(schema.entitlements)
      .values({ workspaceId, ...update })
      .onConflictDoUpdate({ target: schema.entitlements.workspaceId, set: update });
  } else if (product === "monitor" && typeof session.subscription === "string") {
    await applySubscription(await stripe().subscriptions.retrieve(session.subscription));
  } else if (product === "consult" && session.payment_status === "paid") {
    // A consultation is a call, not report access.
    await db()
      .update(schema.consultations)
      .set({ status: "paid", amountCents: session.amount_total })
      .where(eq(schema.consultations.stripeSessionId, session.id));
  }
}

/** Verifies and applies a webhook. Returns false for a replayed event. */
export async function handleWebhook(payload: string, signature: string): Promise<boolean> {
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  const event = stripe().webhooks.constructEvent(payload, signature, secret);

  const inserted = await db()
    .insert(schema.billingEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: schema.billingEvents.id });
  if (inserted.length === 0) return false;

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await applyCheckout(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscription(event.data.object);
        break;
    }
  } catch (e) {
    // Let Stripe retry: forget the event so the retry isn't treated as a replay.
    await db().delete(schema.billingEvents).where(eq(schema.billingEvents.id, event.id));
    throw e;
  }
  return true;
}

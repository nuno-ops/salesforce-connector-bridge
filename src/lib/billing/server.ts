import "server-only";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { auditPurchaseUpdate, resolveAccess, subscriptionUpdate, type Access, type EntitlementState } from "./access";

export type Product = "monitor" | "audit" | "consult";

let client: Stripe | undefined;

/** Lazily created so builds don't need the secret key. */
export function stripe(): Stripe {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}

export function priceFor(product: Product): string {
  const e = env();
  const price = { monitor: e.STRIPE_PRICE_MONITOR, audit: e.STRIPE_PRICE_AUDIT, consult: e.STRIPE_PRICE_CONSULT }[product];
  if (!price) throw new Error(`No Stripe price configured for ${product}`);
  return price;
}

async function entitlementRow(workspaceId: string) {
  const [row] = await db().select().from(schema.entitlements).where(eq(schema.entitlements.workspaceId, workspaceId)).limit(1);
  return row ?? null;
}

export async function getAccess(workspaceId: string): Promise<Access> {
  return resolveAccess(await entitlementRow(workspaceId), { billingEnabled: env().BILLING_ENABLED });
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
}): Promise<string> {
  const appUrl = env().NEXT_PUBLIC_APP_URL;
  const customer = await ensureCustomer(params.workspaceId, params.email);
  const metadata = { workspaceId: params.workspaceId, userId: params.userId, product: params.product };
  const session = await stripe().checkout.sessions.create({
    mode: params.product === "monitor" ? "subscription" : "payment",
    customer,
    line_items: [{ price: priceFor(params.product), quantity: 1 }],
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

async function applyCheckout(session: Stripe.Checkout.Session) {
  const { workspaceId, product } = session.metadata ?? {};
  if (!workspaceId) return;
  if (product === "audit" && session.payment_status === "paid") {
    const update = auditPurchaseUpdate(toState(await entitlementRow(workspaceId)), env().AUDIT_ACCESS_HOURS);
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

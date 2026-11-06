"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConnection } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { setMark } from "@/lib/marks";
import { disconnect } from "@/lib/salesforce/connection";
import { ADD_ON_KEYS, type AddOnPrices, type AppPrices } from "@/lib/savings/prices";
import { executeScan, getPriceBook, lastScanAttempt, latestScan, recompute, startScan } from "@/lib/scan";
import { startInBackground } from "@/lib/scan-background";
import { shareReport } from "@/lib/shares";

export interface ActionState {
  status: "idle" | "ok" | "error";
  message?: string;
}

export interface ScanState extends ActionState {
  /** The scan is still running in the background; poll `scanStatusAction`. */
  running?: boolean;
}

export async function runScanAction(connectionId: string): Promise<ScanState> {
  const { connection } = await requireConnection(connectionId);
  const scan = await startScan(connection);
  // On Netlify the scan runs in a background function; elsewhere (local dev) it runs here.
  if (await startInBackground(scan.id)) return { status: "ok", running: true };
  const done = await executeScan(scan, connection);
  revalidatePath(`/orgs/${connectionId}`);
  return done.status === "succeeded" ? { status: "ok" } : { status: "error", message: done.error ?? "Scan failed." };
}

export async function scanStatusAction(connectionId: string): Promise<ScanState> {
  await requireConnection(connectionId);
  const scan = await lastScanAttempt(connectionId);
  if (scan?.status === "running") return { status: "ok", running: true };
  return scan?.status === "failed" ? { status: "error", message: scan.error ?? "Scan failed." } : { status: "ok" };
}

const price = z.coerce.number().min(0).max(100_000);
const priceForm = z.object({
  fullMonthly: price,
  platformMonthly: price,
  integrationMonthly: price,
  fullSandboxMonthly: z.union([z.literal("").transform(() => null), price]),
  source: z.enum(["manual", "contract"]).default("manual"),
});

async function repriceLatest(connection: { id: string; edition: string; workspaceId: string; isSandbox: boolean }) {
  const scan = await latestScan(connection.id, { succeededOnly: true });
  if (!scan?.snapshot) return;
  await recompute({ ...scan, snapshot: scan.snapshot }, await getPriceBook(connection), connection);
}

export async function savePricesAction(connectionId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { connection } = await requireConnection(connectionId);
  const parsed = priceForm.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Prices must be numbers between 0 and 100,000." };
  await db()
    .insert(schema.priceBooks)
    .values({ connectionId, ...parsed.data })
    .onConflictDoUpdate({ target: schema.priceBooks.connectionId, set: parsed.data });
  await repriceLatest(connection);
  revalidatePath(`/orgs/${connectionId}`);
  return { status: "ok", message: "Prices saved and savings recalculated." };
}

export async function resetPricesAction(connectionId: string) {
  const { connection } = await requireConnection(connectionId);
  await db().delete(schema.priceBooks).where(eq(schema.priceBooks.connectionId, connectionId));
  await repriceLatest(connection);
  revalidatePath(`/orgs/${connectionId}`);
}

const appPrice = z.union([z.literal("").transform(() => null), price]);
/** AWS commitments are yearly totals, so they run far above any per-seat price. */
const awsAmount = z.union([z.literal("").transform(() => null), z.coerce.number().min(0).max(1_000_000_000)]);

/** Fields are named `package:<namespace>`, `connected:<app name>` and `addon:<key>`; blank removes a price. */
export async function saveAppPricesAction(connectionId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { connection } = await requireConnection(connectionId);
  const prices: AppPrices = { packages: {}, connectedApps: {} };
  const addOns: AddOnPrices = {};
  for (const [key, value] of formData) {
    const [kind, ...rest] = key.split(":");
    const name = rest.join(":");
    if ((kind !== "package" && kind !== "connected" && kind !== "addon") || !name || typeof value !== "string") continue;
    const isAws = kind === "addon" && name.startsWith("aws");
    const parsed = (isAws ? awsAmount : appPrice).safeParse(value.trim());
    if (!parsed.success) {
      return { status: "error", message: isAws ? "AWS amounts must be positive numbers." : `The price for ${name} must be a number between 0 and 100,000.` };
    }
    if (parsed.data === null) continue;
    if (kind === "addon") {
      const addOn = ADD_ON_KEYS.find((k) => k === name);
      if (addOn) addOns[addOn] = parsed.data;
    } else (kind === "package" ? prices.packages : prices.connectedApps)[name] = parsed.data;
  }
  if (Object.keys(addOns).length > 0) prices.addOns = addOns;
  await db()
    .insert(schema.appPrices)
    .values({ connectionId, prices })
    .onConflictDoUpdate({ target: schema.appPrices.connectionId, set: { prices } });
  await repriceLatest(connection);
  revalidatePath(`/orgs/${connectionId}`);
  return { status: "ok", message: "App prices saved and savings recalculated." };
}

export async function disconnectAction(connectionId: string) {
  const { connection } = await requireConnection(connectionId);
  await disconnect(connection);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}


export async function markRecommendationAction(connectionId: string, recommendationId: string, status: "done" | "keep" | null): Promise<ActionState> {
  const { connection, user } = await requireConnection(connectionId);
  const scan = await latestScan(connection.id, { succeededOnly: true });
  const rec = scan?.result?.recommendations.find((r) => r.id === recommendationId);
  if (!rec || !scan?.result) return { status: "error", message: "Rescan, then try again." };
  await setMark({ connection, user, rec, currency: scan.result.prices.currency ?? "USD", status });
  revalidatePath(`/orgs/${connectionId}`);
  return { status: "ok" };
}

export interface ShareState extends ActionState {
  url?: string;
}

const shareForm = z.object({
  email: z.union([z.literal(""), z.email()]),
  note: z.string().max(500),
});

export async function shareReportAction(connectionId: string, _prev: ShareState, formData: FormData): Promise<ShareState> {
  const { connection, user } = await requireConnection(connectionId);
  const parsed = shareForm.safeParse({ email: String(formData.get("email") ?? "").trim(), note: String(formData.get("note") ?? "") });
  if (!parsed.success) return { status: "error", message: "Enter a valid email address, or leave it empty to just get a link." };
  const result = await shareReport({ connection, user, email: parsed.data.email || null, note: parsed.data.note.trim() || null });
  if (!result.ok) return { status: "error", message: result.message };
  const message = parsed.data.email
    ? result.emailed
      ? `Sent to ${parsed.data.email}. You can also copy the link.`
      : "We couldn't send the email just now, but the link works. Copy it below."
    : "Here's your read-only link.";
  return { status: "ok", message, url: result.url };
}

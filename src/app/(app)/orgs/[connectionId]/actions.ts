"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { extractContractPrices } from "@/lib/ai/claude";
import { requireConnection } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { disconnect } from "@/lib/salesforce/connection";
import { getPriceBook, latestScan, recompute, runScan } from "@/lib/scan";

export interface ActionState {
  status: "idle" | "ok" | "error";
  message?: string;
}

export async function runScanAction(connectionId: string): Promise<ActionState> {
  const { connection } = await requireConnection(connectionId);
  const scan = await runScan(connection);
  revalidatePath(`/orgs/${connectionId}`);
  return scan.status === "succeeded" ? { status: "ok" } : { status: "error", message: scan.error ?? "Scan failed." };
}

const price = z.coerce.number().min(0).max(100_000);
const priceForm = z.object({
  fullMonthly: price,
  platformMonthly: price,
  integrationMonthly: price,
  fullSandboxMonthly: z.union([z.literal("").transform(() => null), price]),
  source: z.enum(["manual", "contract"]).default("manual"),
});

async function repriceLatest(connection: { id: string; edition: string }) {
  const scan = await latestScan(connection.id, { succeededOnly: true });
  if (!scan?.snapshot) return;
  await recompute({ ...scan, snapshot: scan.snapshot }, await getPriceBook(connection));
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

export interface ContractState extends ActionState {
  prices?: { fullMonthly: number | null; platformMonthly: number | null; fullSandboxMonthly: number | null; notes: string };
}

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export async function extractContractAction(connectionId: string, _prev: ContractState, formData: FormData): Promise<ContractState> {
  await requireConnection(connectionId);
  const file = formData.get("contract");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Choose a PDF first." };
  if (file.type !== "application/pdf" || file.size > MAX_PDF_BYTES) {
    return { status: "error", message: "Upload a PDF under 20 MB." };
  }
  try {
    // The PDF is sent to Claude and never stored.
    const prices = await extractContractPrices(Buffer.from(await file.arrayBuffer()));
    return { status: "ok", prices };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Couldn't read the contract." };
  }
}

export async function disconnectAction(connectionId: string) {
  const { connection } = await requireConnection(connectionId);
  await disconnect(connection);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}


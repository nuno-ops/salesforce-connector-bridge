import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { SalesforceAuthError } from "@/lib/salesforce/client";
import { collectSnapshot } from "@/lib/salesforce/collect";
import { clientFor, markExpired } from "@/lib/salesforce/connection";
import type { OrgSnapshot } from "@/lib/salesforce/types";
import { computeSavings, toOtherOrg, type OtherOrg } from "@/lib/savings/engine";
import { defaultPriceBook, type PriceBook } from "@/lib/savings/prices";

type Connection = typeof schema.sfConnections.$inferSelect;
export type Scan = typeof schema.scans.$inferSelect;

export async function getPriceBook(connection: Pick<Connection, "id" | "edition">): Promise<PriceBook> {
  const database = db();
  const [[row], [apps]] = await Promise.all([
    database.select().from(schema.priceBooks).where(eq(schema.priceBooks.connectionId, connection.id)).limit(1),
    database.select().from(schema.appPrices).where(eq(schema.appPrices.connectionId, connection.id)).limit(1),
  ]);
  const base: PriceBook = row
    ? {
        fullMonthly: row.fullMonthly,
        platformMonthly: row.platformMonthly,
        integrationMonthly: row.integrationMonthly,
        fullSandboxMonthly: row.fullSandboxMonthly,
        source: row.source,
      }
    : defaultPriceBook(connection.edition);
  return apps ? { ...base, apps: apps.prices } : base;
}

export async function latestScan(connectionId: string, { succeededOnly = false } = {}) {
  const [scan] = await db()
    .select()
    .from(schema.scans)
    .where(
      succeededOnly
        ? and(eq(schema.scans.connectionId, connectionId), eq(schema.scans.status, "succeeded"))
        : eq(schema.scans.connectionId, connectionId),
    )
    .orderBy(desc(schema.scans.startedAt))
    .limit(1);
  return scan ?? null;
}

/** Status of the most recent scan attempt, without the stored snapshot and result. */
export async function lastScanAttempt(connectionId: string) {
  const [scan] = await db()
    .select({ id: schema.scans.id, status: schema.scans.status, error: schema.scans.error, startedAt: schema.scans.startedAt })
    .from(schema.scans)
    .where(eq(schema.scans.connectionId, connectionId))
    .orderBy(desc(schema.scans.startedAt))
    .limit(1);
  return scan ?? null;
}

export async function scanHistory(connectionId: string, limit = 12) {
  return db()
    .select({
      id: schema.scans.id,
      startedAt: schema.scans.startedAt,
      annualSavings: schema.scans.annualSavings,
      trigger: schema.scans.trigger,
    })
    .from(schema.scans)
    .where(and(eq(schema.scans.connectionId, connectionId), eq(schema.scans.status, "succeeded")))
    .orderBy(desc(schema.scans.startedAt))
    .limit(limit);
}

/** The latest scan of every other active org in the workspace, for the cross-org seat check. */
export async function otherOrgs(connection: Pick<Connection, "id" | "workspaceId">): Promise<OtherOrg[]> {
  const rows = await db()
    .selectDistinctOn([schema.scans.connectionId], { snapshot: schema.scans.snapshot })
    .from(schema.scans)
    .innerJoin(schema.sfConnections, eq(schema.sfConnections.id, schema.scans.connectionId))
    .where(
      and(
        eq(schema.sfConnections.workspaceId, connection.workspaceId),
        ne(schema.sfConnections.id, connection.id),
        eq(schema.sfConnections.status, "active"),
        eq(schema.sfConnections.isSandbox, false),
        eq(schema.scans.status, "succeeded"),
      ),
    )
    .orderBy(schema.scans.connectionId, desc(schema.scans.startedAt));
  return rows.flatMap((r) => (r.snapshot ? [toOtherOrg(r.snapshot)] : []));
}

/** Reads the org, stores the snapshot and computes savings. Never throws; failures are recorded on the scan. */
export async function runScan(connection: Connection, trigger: "manual" | "scheduled" = "manual"): Promise<Scan> {
  const database = db();
  const [scan] = await database.insert(schema.scans).values({ connectionId: connection.id, trigger }).returning();
  try {
    const snapshot = await collectSnapshot(clientFor(connection));
    const [prices, others] = await Promise.all([getPriceBook(connection), otherOrgs(connection)]);
    const result = computeSavings(snapshot, prices, { otherOrgs: connection.isSandbox ? [] : others });
    const [done] = await database
      .update(schema.scans)
      .set({ status: "succeeded", snapshot, result, annualSavings: result.annualSavings, finishedAt: new Date() })
      .where(eq(schema.scans.id, scan.id))
      .returning();
    // Keep the org name and edition current.
    await database
      .update(schema.sfConnections)
      .set({ orgName: snapshot.organization.name, edition: snapshot.organization.edition, status: "active" })
      .where(eq(schema.sfConnections.id, connection.id));
    return done;
  } catch (e) {
    if (e instanceof SalesforceAuthError) await markExpired(connection.id);
    const [failed] = await database
      .update(schema.scans)
      .set({ status: "failed", error: e instanceof Error ? e.message : String(e), finishedAt: new Date() })
      .where(eq(schema.scans.id, scan.id))
      .returning();
    return failed;
  }
}

/** Re-prices a stored snapshot, e.g. after the customer edits their prices. No Salesforce calls. */
export async function recompute(
  scan: Scan & { snapshot: OrgSnapshot },
  prices: PriceBook,
  connection: Pick<Connection, "id" | "workspaceId" | "isSandbox">,
) {
  const others = connection.isSandbox ? [] : await otherOrgs(connection);
  const result = computeSavings(scan.snapshot, prices, { now: new Date(scan.snapshot.capturedAt), otherOrgs: others });
  await db()
    .update(schema.scans)
    .set({ result, annualSavings: result.annualSavings })
    .where(eq(schema.scans.id, scan.id));
  return result;
}

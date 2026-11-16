import "server-only";
import { and, desc, eq, gt, inArray, notExists, sql } from "drizzle-orm";
import { sign } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { customerEmail } from "@/lib/email/scan-notify";
import { sendOnce } from "@/lib/email/send";
import { nudgeDue, renewalStage, rescanDue } from "@/lib/email/reminders";
import { nudgeEmail, renewalEmail } from "@/lib/email/templates";
import { calendlyUrl, env } from "@/lib/env";
import { summarizeContract } from "@/lib/savings/contract";
import { startScan } from "@/lib/scan";

/** Scheduled functions stop after 30 seconds, so each run starts at most this many rescans. */
const MAX_RESCANS = 10;

/** Once a day (netlify/functions/daily.mjs): sign-up nudges, renewal reminders and monthly rescans for paid orgs. */
export async function runDaily(now = new Date()) {
  const [nudges, renewals, rescans] = await Promise.all([sendNudges(now), sendRenewalReminders(now), startRescans(now)]);
  return { nudges, renewals, rescans };
}

/** Owners who signed up 2-7 days ago and have no org connected. */
async function sendNudges(now: Date) {
  const database = db();
  const since = new Date(now.getTime() - 7 * 86_400_000);
  const owners = await database
    .select({ userId: schema.profiles.id, email: schema.profiles.email, createdAt: schema.profiles.createdAt, workspaceId: schema.memberships.workspaceId })
    .from(schema.memberships)
    .innerJoin(schema.profiles, eq(schema.profiles.id, schema.memberships.userId))
    .where(
      and(
        eq(schema.memberships.role, "owner"),
        gt(schema.profiles.createdAt, since),
        notExists(database.select({ one: sql`1` }).from(schema.sfConnections).where(eq(schema.sfConnections.workspaceId, schema.memberships.workspaceId))),
      ),
    );
  const appUrl = env().NEXT_PUBLIC_APP_URL;
  let sent = 0;
  for (const o of owners.filter((o) => nudgeDue(o.createdAt, now))) {
    const email = nudgeEmail({ dashboardUrl: `${appUrl}/dashboard`, callUrl: calendlyUrl() });
    if (await sendOnce(`nudge:${o.userId}`, "nudge", o.workspaceId, { to: [o.email], ...email })) sent++;
  }
  return sent;
}

/** Each production org's latest successful scan, for the contract end date and the savings found. */
async function latestScans() {
  return db()
    .selectDistinctOn([schema.scans.connectionId], { scan: schema.scans, connection: schema.sfConnections })
    .from(schema.scans)
    .innerJoin(schema.sfConnections, eq(schema.sfConnections.id, schema.scans.connectionId))
    .where(and(eq(schema.scans.status, "succeeded"), eq(schema.sfConnections.status, "active"), eq(schema.sfConnections.isSandbox, false)))
    .orderBy(schema.scans.connectionId, desc(schema.scans.startedAt));
}

async function sendRenewalReminders(now: Date) {
  const appUrl = env().NEXT_PUBLIC_APP_URL;
  let sent = 0;
  for (const { scan, connection } of await latestScans()) {
    const contract = summarizeContract(scan.snapshot?.salesforceAccount, now);
    const savings = scan.result?.annualSavings ?? 0;
    if (!contract || savings <= 0) continue;
    const stage = renewalStage(contract.daysLeft);
    if (!stage) continue;
    const to = await customerEmail(connection);
    if (!to) continue;
    const email = renewalEmail({
      orgName: connection.orgName,
      endDate: contract.endDate,
      noticeBy: contract.noticeBy,
      daysLeft: contract.daysLeft,
      annualSavings: savings,
      currency: scan.result?.prices.currency ?? "USD",
      reportUrl: `${appUrl}/orgs/${connection.id}`,
      callUrl: calendlyUrl(),
    });
    if (await sendOnce(`renewal${stage}:${connection.id}:${contract.endDate}`, "renewal", connection.workspaceId, { to: [to], ...email })) sent++;
  }
  return sent;
}

/** Orgs in workspaces with a paid unlock still running, whose last scan is a month old, rescanned in the background. */
async function startRescans(now: Date) {
  const database = db();
  const rows = await database
    .select({ connection: schema.sfConnections, accessUntil: schema.entitlements.auditAccessUntil })
    .from(schema.sfConnections)
    .innerJoin(schema.entitlements, eq(schema.entitlements.workspaceId, schema.sfConnections.workspaceId))
    .where(and(eq(schema.sfConnections.status, "active"), gt(schema.entitlements.auditAccessUntil, now)));
  if (rows.length === 0) return 0;
  const lastScans = await database
    .select({ connectionId: schema.scans.connectionId, at: sql<Date>`max(${schema.scans.startedAt})`.mapWith((v) => new Date(v)) })
    .from(schema.scans)
    .where(inArray(schema.scans.connectionId, rows.map((r) => r.connection.id)))
    .groupBy(schema.scans.connectionId);
  const last = new Map(lastScans.map((s) => [s.connectionId, s.at]));
  const due = rows.filter((r) => rescanDue(last.get(r.connection.id) ?? null, r.accessUntil, now)).slice(0, MAX_RESCANS);
  let started = 0;
  for (const { connection } of due) {
    const scan = await startScan(connection, "scheduled");
    if (await kickBackgroundScan(scan.id)) started++;
  }
  return started;
}

/** Hands a scan to the background function on the live site. A scan nobody picks up is marked failed after 16 minutes. */
async function kickBackgroundScan(scanId: string): Promise<boolean> {
  const base = process.env.URL ?? env().NEXT_PUBLIC_APP_URL;
  try {
    const res = await fetch(`${base}/.netlify/functions/scan-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId, signature: sign(scanId) }),
      signal: AbortSignal.timeout(5000),
    });
    return res.status === 202;
  } catch (error) {
    console.error("daily: couldn't start rescan", error);
    return false;
  }
}

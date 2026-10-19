import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { calendlyUrl, env } from "@/lib/env";
import { formatCurrency } from "@/lib/utils";
import { escapeHtml, ownerEmails, sendEmail } from "./send";
import { scanEmailPlan, scanFailedEmail, scanReadyEmail } from "./scan-ready";

type Connection = typeof schema.sfConnections.$inferSelect;
type Scan = typeof schema.scans.$inferSelect;

/** Who to email about an org: whoever connected it, else the workspace owner. */
async function customerEmail(connection: Connection): Promise<string | null> {
  const database = db();
  if (connection.connectedBy) {
    const [p] = await database.select({ email: schema.profiles.email }).from(schema.profiles).where(eq(schema.profiles.id, connection.connectedBy)).limit(1);
    if (p?.email) return p.email;
  }
  const [owner] = await database
    .select({ email: schema.profiles.email })
    .from(schema.memberships)
    .innerJoin(schema.profiles, eq(schema.profiles.id, schema.memberships.userId))
    .where(and(eq(schema.memberships.workspaceId, connection.workspaceId), eq(schema.memberships.role, "owner")))
    .limit(1);
  return owner?.email ?? null;
}

/** Emails the customer (and, for an org's first scan, the owner) about a finished scan. Never throws. */
export async function notifyScanFinished(scan: Scan, connection: Connection): Promise<void> {
  try {
    if (scan.status === "running") return;
    const [earlier] = await db()
      .select({ id: schema.scans.id })
      .from(schema.scans)
      .where(and(eq(schema.scans.connectionId, connection.id), ne(schema.scans.id, scan.id), eq(schema.scans.status, "succeeded")))
      .limit(1);
    const durationMs = (scan.finishedAt ?? new Date()).getTime() - scan.startedAt.getTime();
    const plan = scanEmailPlan({ trigger: scan.trigger, durationMs, firstForOrg: !earlier });
    if (!plan.customer && !plan.owner) return;

    const input = {
      orgName: connection.orgName,
      reportUrl: `${env().NEXT_PUBLIC_APP_URL}/orgs/${connection.id}`,
      callUrl: calendlyUrl(),
    };
    const email = scan.status === "succeeded" && scan.result ? scanReadyEmail(scan.result, input) : scanFailedEmail(scan.error, input);
    const customer = await customerEmail(connection);

    if (plan.customer && customer) await sendEmail({ to: [customer], ...email }, "Scan email");
    if (plan.owner) {
      const outcome =
        scan.status === "succeeded"
          ? `scanned, ${formatCurrency(scan.annualSavings ?? 0, scan.result?.prices.currency ?? "USD")} a year found`
          : `scan failed: ${scan.error ?? "unknown error"}`;
      const line = `${connection.orgName} (${connection.edition}${connection.isSandbox ? ", sandbox" : ""}) for ${customer ?? "unknown user"}: ${outcome}`;
      await sendEmail(
        { to: ownerEmails(), subject: `New org ${scan.status === "succeeded" ? "scanned" : "scan failed"}: ${connection.orgName}`, text: line, html: `<p>${escapeHtml(line)}</p>` },
        "Owner scan alert",
      );
    }
  } catch (error) {
    console.error("Scan email failed", error);
  }
}

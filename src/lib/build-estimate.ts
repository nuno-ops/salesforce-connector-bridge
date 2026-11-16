import "server-only";
import { and, eq, like } from "drizzle-orm";
import type { CurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { escapeHtml, ownerEmails, sendOnce, sentToday } from "@/lib/email/send";
import { env } from "@/lib/env";
import { estimateCandidates } from "@/lib/savings/build-options";
import { latestScan } from "@/lib/scan";
import { formatCurrency, formatDate } from "@/lib/utils";

type Connection = typeof schema.sfConnections.$inferSelect;

/** Estimate requests one workspace can send a day, so the button can't flood the owner's inbox. */
const DAILY_ESTIMATE_LIMIT = 10;
const KIND = "build_estimate";

const keyFor = (connectionId: string, app: string) => `estimate:${connectionId}:${app.toLowerCase()}`;

export type EstimateResult = { ok: true } | { ok: false; message: string };

/**
 * Emails the owner a request to estimate building an app's job in Salesforce, once per org and app.
 * Only apps from the latest scan's estimate list can be requested; replies go straight to the customer.
 */
export async function requestBuildEstimate(input: { connection: Connection; user: CurrentUser; app: string }): Promise<EstimateResult> {
  const { connection, user } = input;
  const scan = await latestScan(connection.id, { succeededOnly: true });
  const candidate = scan?.result ? estimateCandidates(scan.result).find((c) => c.app === input.app) : undefined;
  if (!scan?.result || !candidate) return { ok: false, message: "Rescan, then try again." };
  const to = ownerEmails();
  if (to.length === 0) return { ok: false, message: "Estimates aren't available right now. Book a call instead." };
  if ((await sentToday(connection.workspaceId, [KIND])) >= DAILY_ESTIMATE_LIMIT) {
    return { ok: false, message: "You've asked for a lot of estimates today. Try again tomorrow." };
  }

  const currency = scan.result.prices.currency ?? "USD";
  const rows: [string, string][] = [
    ["App", candidate.app],
    ["Category", candidate.category ?? "Installed package"],
    ["Users", candidate.users === null ? "Unknown" : String(candidate.users)],
    ["Yearly cost", candidate.annualCost === null ? "No price entered" : formatCurrency(candidate.annualCost, currency)],
    ["Last used", candidate.lastUsed ? formatDate(candidate.lastUsed) : "Unknown"],
    ["Org", `${connection.orgName} (${connection.edition})`],
    ["Requested by", user.fullName ? `${user.fullName} <${user.email}>` : user.email],
  ];
  const report = `${env().NEXT_PUBLIC_APP_URL}/orgs/${connection.id}`;
  const sent = await sendOnce(keyFor(connection.id, candidate.app), KIND, connection.workspaceId, {
    to,
    replyTo: user.email,
    subject: `Build estimate request: ${candidate.app} (${connection.orgName})`,
    text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nReply to this email to answer the customer.\nReport: ${report}`,
    html: `<p>A customer asked for an estimate to replace a paid app with a Salesforce build. Reply to this email to answer them.</p><table>${rows
      .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#666">${k}</td><td>${escapeHtml(v)}</td></tr>`)
      .join("")}</table><p>Report (only visible to the customer's workspace): ${escapeHtml(report)}</p>`,
  });
  return sent ? { ok: true } : { ok: false, message: "Already requested, or the email didn't send. We'll be in touch." };
}

/** Apps this org already asked about, lower-cased. */
export async function requestedEstimates(connectionId: string): Promise<Set<string>> {
  const prefix = keyFor(connectionId, "");
  const rows = await db()
    .select({ key: schema.emailLog.key })
    .from(schema.emailLog)
    .where(and(eq(schema.emailLog.kind, KIND), like(schema.emailLog.key, `${prefix}%`)));
  return new Set(rows.map((r) => r.key.slice(prefix.length)));
}

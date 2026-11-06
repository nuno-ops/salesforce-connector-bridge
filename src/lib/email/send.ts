import "server-only";
import { and, count, eq, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";

export interface Email {
  to: string[];
  subject: string;
  text: string;
  html: string;
  /** Where replies go, e.g. the colleague who sent an invite. Defaults to support@. */
  replyTo?: string;
}

export { escapeHtml } from "./html";

/** The owner's alert addresses from SIGNUP_ALERT_EMAIL (comma-separated). */
export function ownerEmails(): string[] {
  return (env().SIGNUP_ALERT_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

/** Sends through Resend from support@. Never throws; skipped without RESEND_API_KEY. Returns whether it was sent. */
export async function sendEmail(email: Email, label: string): Promise<boolean> {
  const { RESEND_API_KEY, SIGNUP_ALERT_FROM } = env();
  if (!RESEND_API_KEY || email.to.length === 0) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: SIGNUP_ALERT_FROM,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`${label} failed: ${res.status} ${await res.text()}`);
    return res.ok;
  } catch (error) {
    console.error(`${label} failed`, error);
    return false;
  }
}

/**
 * Sends an email at most once per `key` (e.g. one renewal reminder per org and renewal date). The key is claimed
 * before sending, so two runs can't both send; if sending fails the claim is released for the next run.
 */
export async function sendOnce(key: string, kind: string, workspaceId: string | null, email: Email): Promise<boolean> {
  const claimed = await db().insert(schema.emailLog).values({ key, kind, workspaceId }).onConflictDoNothing().returning({ key: schema.emailLog.key });
  if (claimed.length === 0) return false;
  const sent = await sendEmail(email, kind);
  if (!sent) await db().delete(schema.emailLog).where(eq(schema.emailLog.key, key));
  return sent;
}

/** How many emails of these kinds a workspace sent in the last day, to cap invites and shares. */
export async function sentToday(workspaceId: string, kinds: string[]): Promise<number> {
  const [row] = await db()
    .select({ n: count() })
    .from(schema.emailLog)
    .where(and(eq(schema.emailLog.workspaceId, workspaceId), inArray(schema.emailLog.kind, kinds), gte(schema.emailLog.sentAt, new Date(Date.now() - 86_400_000))));
  return row?.n ?? 0;
}

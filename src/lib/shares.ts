import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { CurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { sendEmail, sentToday } from "@/lib/email/send";
import { shareEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { DAILY_SEND_LIMIT } from "@/lib/invites";
import { latestScan } from "@/lib/scan";
import { hashToken, newToken } from "@/lib/tokens";

const SHARE_DAYS = 90;

type Connection = typeof schema.sfConnections.$inferSelect;

export type ShareResult = { ok: true; url: string; emailed: boolean } | { ok: false; message: string };

/** Makes a read-only link to an org's latest results and, given an address, emails it there. */
export async function shareReport(input: { connection: Connection; user: CurrentUser; email: string | null; note: string | null }): Promise<ShareResult> {
  const { connection, user } = input;
  if (input.email && (await sentToday(connection.workspaceId, ["invite", "share"])) >= DAILY_SEND_LIMIT) {
    return { ok: false, message: "You've shared a lot today. Try again tomorrow, or copy a link instead." };
  }
  const scan = await latestScan(connection.id, { succeededOnly: true });
  if (!scan?.result) return { ok: false, message: "Run a scan first, then share the results." };

  const { token, hash } = newToken();
  const database = db();
  await database.insert(schema.reportShares).values({
    connectionId: connection.id,
    tokenHash: hash,
    sharedBy: user.id,
    email: input.email,
    expiresAt: new Date(Date.now() + SHARE_DAYS * 86_400_000),
  });
  const url = `${env().NEXT_PUBLIC_APP_URL}/share/${token}`;
  if (!input.email) return { ok: true, url, emailed: false };

  const from = user.fullName ? `${user.fullName} (${user.email})` : user.email;
  const email = shareEmail({
    from,
    note: input.note,
    orgName: connection.orgName,
    annualSavings: scan.result.annualSavings,
    currency: scan.result.prices.currency ?? "USD",
    shareUrl: url,
  });
  const sent = await sendEmail({ to: [input.email], replyTo: user.email, ...email }, "Share email");
  if (sent) await database.insert(schema.emailLog).values({ key: `share:${hash}`, kind: "share", workspaceId: connection.workspaceId });
  return { ok: true, url, emailed: sent };
}

/** The org behind a share link that's still valid, with who shared it. */
export async function findShare(token: string) {
  const [row] = await db()
    .select({ share: schema.reportShares, connection: schema.sfConnections, sharedByEmail: schema.profiles.email })
    .from(schema.reportShares)
    .innerJoin(schema.sfConnections, eq(schema.sfConnections.id, schema.reportShares.connectionId))
    .leftJoin(schema.profiles, eq(schema.profiles.id, schema.reportShares.sharedBy))
    .where(and(eq(schema.reportShares.tokenHash, hashToken(token)), isNull(schema.reportShares.revokedAt), gt(schema.reportShares.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

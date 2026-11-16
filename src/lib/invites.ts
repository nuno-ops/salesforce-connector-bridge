import "server-only";
import { and, eq, gt, isNull, TransactionRollbackError } from "drizzle-orm";
import { trackStep } from "@/lib/analytics";
import type { CurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { sendEmail, sentToday } from "@/lib/email/send";
import { inviteEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { sendSignupAlert } from "@/lib/signup-alert";
import { hashToken, newToken } from "@/lib/tokens";

const INVITE_DAYS = 14;
/** Invite and share emails a workspace may send a day, so the form can't be used to spam. */
export const DAILY_SEND_LIMIT = 10;

export type InviteResult = { ok: true } | { ok: false; message: string };

/** Emails `email` a link to join the workspace, so a Salesforce admin can connect the org for a colleague. */
export async function sendInvite(input: { workspaceId: string; user: CurrentUser; email: string; note: string | null }): Promise<InviteResult> {
  if (input.email.toLowerCase() === input.user.email.toLowerCase()) return { ok: false, message: "That's your own email. Enter your Salesforce admin's." };
  if ((await sentToday(input.workspaceId, ["invite", "share"])) >= DAILY_SEND_LIMIT) {
    return { ok: false, message: "You've sent a lot of invites today. Try again tomorrow, or email support@salesforcesaver.com." };
  }
  const { token, hash } = newToken();
  const database = db();
  await database.insert(schema.invites).values({
    workspaceId: input.workspaceId,
    email: input.email,
    tokenHash: hash,
    invitedBy: input.user.id,
    expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
  });
  const appUrl = env().NEXT_PUBLIC_APP_URL;
  const from = input.user.fullName ? `${input.user.fullName} (${input.user.email})` : input.user.email;
  const email = inviteEmail({ from, note: input.note, acceptUrl: `${appUrl}/invite/${token}`, securityUrl: `${appUrl}/security` });
  const sent = await sendEmail({ to: [input.email], replyTo: input.user.email, ...email }, "Invite email");
  if (!sent) return { ok: false, message: "We couldn't send the email just now. Please try again in a minute." };
  await database.insert(schema.emailLog).values({ key: `invite:${hash}`, kind: "invite", workspaceId: input.workspaceId });
  return { ok: true };
}

/** An invite that can still be used, with who sent it. */
export async function findInvite(token: string) {
  const [row] = await db()
    .select({ invite: schema.invites, workspaceName: schema.workspaces.name, inviterEmail: schema.profiles.email, inviterName: schema.profiles.fullName })
    .from(schema.invites)
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.invites.workspaceId))
    .leftJoin(schema.profiles, eq(schema.profiles.id, schema.invites.invitedBy))
    .where(and(eq(schema.invites.tokenHash, hashToken(token)), isNull(schema.invites.acceptedAt), gt(schema.invites.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

/**
 * Adds the signed-in user to the inviting workspace as an admin and uses up the invite. A first-time user gets no
 * workspace of their own, so they land straight in their colleague's to connect the org.
 */
export async function acceptInvite(user: CurrentUser, token: string): Promise<boolean> {
  const joined = await db().transaction(async (tx) => {
    const [profile] = await tx.select({ id: schema.profiles.id }).from(schema.profiles).where(eq(schema.profiles.id, user.id)).limit(1);
    // A brand-new account has no profile yet. Without a valid invite this rolls back, so nothing is left behind.
    if (!profile) await tx.insert(schema.profiles).values({ id: user.id, email: user.email, fullName: user.fullName });
    const [invite] = await tx
      .update(schema.invites)
      .set({ acceptedAt: new Date(), acceptedBy: user.id })
      .where(and(eq(schema.invites.tokenHash, hashToken(token)), isNull(schema.invites.acceptedAt), gt(schema.invites.expiresAt, new Date())))
      .returning({ workspaceId: schema.invites.workspaceId });
    if (!invite) return tx.rollback();
    await tx.insert(schema.memberships).values({ workspaceId: invite.workspaceId, userId: user.id, role: "admin" }).onConflictDoNothing();
    return { id: invite.workspaceId, newAccount: !profile };
  }).catch((error) => {
    if (!(error instanceof TransactionRollbackError)) console.error("accept invite failed", error);
    return null;
  });
  if (!joined) return false;
  if (joined.newAccount) {
    await sendSignupAlert(user);
    await trackStep("signed_up", { userId: user.id, workspaceId: joined.id, props: { method: user.provider, invited: true } });
  }
  return true;
}

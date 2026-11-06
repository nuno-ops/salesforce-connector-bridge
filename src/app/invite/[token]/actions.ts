"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { acceptInvite } from "@/lib/invites";
import { looksLikeToken } from "@/lib/tokens";

export async function acceptInviteAction(token: string) {
  const user = await requireUser();
  const ok = looksLikeToken(token) && (await acceptInvite(user, token));
  redirect(ok ? "/dashboard" : `/invite/${encodeURIComponent(token)}?error=1`);
}

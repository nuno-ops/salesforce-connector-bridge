"use server";

import { z } from "zod";
import { requireWorkspace } from "@/lib/auth";
import { sendInvite } from "@/lib/invites";

export interface InviteState {
  status: "idle" | "ok" | "error";
  message?: string;
}

const form = z.object({
  email: z.email(),
  note: z.string().max(500).optional(),
});

export async function inviteAdminAction(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const { user, workspace } = await requireWorkspace();
  const parsed = form.safeParse({ email: String(formData.get("email") ?? "").trim(), note: String(formData.get("note") ?? "") });
  if (!parsed.success) return { status: "error", message: "Enter a valid email address." };
  const result = await sendInvite({ workspaceId: workspace.id, user, email: parsed.data.email, note: parsed.data.note?.trim() || null });
  if (!result.ok) return { status: "error", message: result.message };
  return { status: "ok", message: `Sent. When ${parsed.data.email} connects Salesforce, the results show up here for you both.` };
}

"use client";

import { useActionState } from "react";
import { inviteAdminAction, type InviteState } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

/** Emails the Salesforce admin a link to join this workspace and connect the org. */
export function InviteAdminForm() {
  const [state, send, sending] = useActionState<InviteState, FormData>(inviteAdminAction, { status: "idle" });
  if (state.status === "ok") return <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">{state.message}</p>;
  return (
    <form action={send} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-email">Your Salesforce admin&apos;s email</Label>
        <Input id="admin-email" name="email" type="email" required placeholder="admin@yourcompany.com" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-note">Note (optional)</Label>
        <textarea
          id="admin-note"
          name="note"
          maxLength={500}
          rows={2}
          placeholder="Could you connect our Salesforce? It's read-only and shows which licenses we can drop at renewal."
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>
      {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
      <Button type="submit" variant="outline" className="self-start" disabled={sending}>
        {sending ? "Sending…" : "Send to your admin"}
      </Button>
    </form>
  );
}

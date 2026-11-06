"use client";

import { useActionState } from "react";
import { shareReportAction, type ShareState } from "@/app/(app)/orgs/[connectionId]/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

/** Emails a read-only link to the results (e.g. to finance), or just makes one to copy. */
export function ShareForm({ connectionId }: { connectionId: string }) {
  const [state, share, sharing] = useActionState<ShareState, FormData>(shareReportAction.bind(null, connectionId), { status: "idle" });
  return (
    <form action={share} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="share-email">Email (optional)</Label>
          <Input id="share-email" name="email" type="email" placeholder="finance@yourcompany.com" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="share-note">Note (optional)</Label>
          <Input id="share-note" name="note" maxLength={500} placeholder="Savings we can take at renewal" />
        </div>
      </div>
      {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
      {state.status === "ok" && (
        <div className="flex flex-col gap-2 rounded-md bg-accent p-3 text-sm text-accent-foreground">
          <p>{state.message}</p>
          {state.url && <Input readOnly value={state.url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />}
        </div>
      )}
      <Button type="submit" variant="outline" className="self-start" disabled={sharing}>
        {sharing ? "Sharing…" : "Share read-only link"}
      </Button>
    </form>
  );
}

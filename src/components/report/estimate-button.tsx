"use client";

import { useState, useTransition } from "react";
import { requestEstimateAction } from "@/app/(app)/orgs/[connectionId]/actions";
import { Button } from "@/components/ui/button";

/** "Request an estimate" for an app we can't price a build for in real time. */
export function EstimateButton({ connectionId, app, requested }: { connectionId: string; app: string; requested: boolean }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(requested);
  if (done) return <span className="text-xs text-muted-foreground">{message ?? "Requested. We'll email you."}</span>;
  return (
    <span className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await requestEstimateAction(connectionId, app);
            setMessage(res.message ?? null);
            if (res.status === "ok") setDone(true);
          })
        }
      >
        {pending ? "Sending…" : "See what I'd save"}
      </Button>
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </span>
  );
}

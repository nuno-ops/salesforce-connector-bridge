"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runScanAction } from "@/app/(app)/orgs/[connectionId]/actions";

/** Runs a scan; with `auto` it starts as soon as the page loads (first scan after connecting). */
export function ScanButton({ connectionId, auto = false, label = "Rescan" }: { connectionId: string; auto?: boolean; label?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const run = () =>
    startTransition(async () => {
      setError(null);
      const res = await runScanAction(connectionId);
      if (res.status === "error") setError(res.message ?? "Scan failed.");
    });

  useEffect(() => {
    if (auto && !started.current) {
      started.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={run} disabled={pending} variant={auto ? "default" : "outline"}>
        {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        {pending ? "Scanning your org…" : label}
      </Button>
      {error && <p className="max-w-sm text-sm text-danger">{error}</p>}
    </div>
  );
}

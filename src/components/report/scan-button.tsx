"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runScanAction, scanStatusAction, type ScanState } from "@/app/(app)/orgs/[connectionId]/actions";

const POLL_MS = 3000;

/**
 * Runs a scan; with `auto` it starts as soon as the page loads (first scan after connecting). Scans run in the
 * background on Netlify, so it checks back until the scan is done, then reloads the report. `running` picks up a
 * scan that was already going when the page loaded.
 */
export function ScanButton({
  connectionId,
  auto = false,
  running = false,
  label = "Rescan",
}: {
  connectionId: string;
  auto?: boolean;
  running?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [waiting, setWaiting] = useState(running);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const settle = (res: ScanState) => {
    if (res.running) return setWaiting(true);
    setWaiting(false);
    if (res.status === "error") setError(res.message ?? "Scan failed.");
    router.refresh();
  };

  const run = () =>
    startTransition(async () => {
      setError(null);
      settle(await runScanAction(connectionId));
    });

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(async () => settle(await scanStatusAction(connectionId)), POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, connectionId]);

  useEffect(() => {
    if (auto && !started.current && !running) {
      started.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const busy = pending || waiting;
  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={run} disabled={busy} variant={auto ? "default" : "outline"}>
        {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        {busy ? "Scanning your org…" : label}
      </Button>
      {waiting && <p className="max-w-sm text-xs text-muted-foreground">Big orgs can take a few minutes. You can leave this page and come back.</p>}
      {error && <p className="max-w-sm text-sm text-danger">{error}</p>}
    </div>
  );
}

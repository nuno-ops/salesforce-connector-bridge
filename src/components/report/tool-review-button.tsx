"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { analyseToolsAction } from "@/app/(app)/orgs/[connectionId]/actions";

export function ToolReviewButton({ connectionId, rerun = false }: { connectionId: string; rerun?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant={rerun ? "ghost" : "default"}
        size={rerun ? "sm" : "default"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await analyseToolsAction(connectionId);
            if (res.status === "error") setError(res.message ?? "The AI review failed.");
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {pending ? "Reviewing apps…" : rerun ? "Run again" : "Review connected apps with AI"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { markRecommendationAction } from "@/app/(app)/orgs/[connectionId]/actions";

/** Done / Keep on a recommendation, or Undo once it's marked. */
export function MarkButtons({ connectionId, recommendationId, status }: { connectionId: string; recommendationId: string; status: "done" | "keep" | null }) {
  const [pending, start] = useTransition();
  const mark = (next: "done" | "keep" | null) => start(async () => void (await markRecommendationAction(connectionId, recommendationId, next)));
  const base = "text-xs font-semibold underline-offset-4 hover:underline disabled:opacity-50";
  if (status) {
    return (
      <button type="button" className={`${base} text-muted-foreground`} disabled={pending} onClick={() => mark(null)}>
        Undo
      </button>
    );
  }
  return (
    <span className="flex gap-3">
      <button type="button" className={`${base} text-cobalt`} disabled={pending} onClick={() => mark("done")} title="I've made this saving">
        Mark done
      </button>
      <button type="button" className={`${base} text-muted-foreground`} disabled={pending} onClick={() => mark("keep")} title="We'll keep paying for this">
        Keep
      </button>
    </span>
  );
}

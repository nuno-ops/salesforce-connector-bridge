"use client";

import { Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";

/** Shows a spinner in place of `children` while the enclosing <Link> is navigating. Must render inside a Link. */
export function PendingHint({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 aria-label="Opening" className="size-5 animate-spin text-cobalt" /> : <>{children}</>;
}

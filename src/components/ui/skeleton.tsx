import { cn } from "@/lib/utils";

/** A placeholder block that pulses while the real content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

/** Visible loading message for screen readers and anyone who reads before the skeleton registers. */
export function LoadingNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
      <span className="size-2 animate-ping rounded-full bg-cobalt" />
      {children}
    </p>
  );
}

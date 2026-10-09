import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}
export const THead = (p: ComponentProps<"thead">) => <thead {...p} className={cn("border-b border-border", p.className)} />;
export const TBody = (p: ComponentProps<"tbody">) => <tbody {...p} className={cn("divide-y divide-border", p.className)} />;
export const TR = (p: ComponentProps<"tr">) => <tr {...p} className={cn("hover:bg-muted/50", p.className)} />;
export const TH = (p: ComponentProps<"th">) => (
  <th {...p} className={cn("px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground", p.className)} />
);
export const TD = (p: ComponentProps<"td">) => <td {...p} className={cn("px-3 py-2 align-top", p.className)} />;

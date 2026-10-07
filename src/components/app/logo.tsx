import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
      <span aria-hidden className="flex size-6 items-center justify-center rounded-md bg-foreground text-[13px] font-bold text-background">
        S
      </span>
      Salesforce Saver
    </Link>
  );
}

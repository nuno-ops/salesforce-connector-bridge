import { PiggyBank } from "lucide-react";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <PiggyBank className="size-5" />
      </span>
      Salesforce Saver
    </Link>
  );
}

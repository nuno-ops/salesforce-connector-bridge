import Link from "next/link";

/** The three-block brand mark from the landing page. */
export function BrandMark() {
  return (
    <span aria-hidden className="inline-grid size-[23px] -rotate-[8deg] grid-cols-3 gap-[2px]">
      <span className="rounded-[2px] bg-foreground" />
      <span className="-translate-y-[3px] rounded-[2px] bg-cobalt" />
      <span className="translate-y-[3px] rounded-[2px] bg-lime" />
    </span>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 whitespace-nowrap text-lg font-extrabold tracking-[-0.04em]">
      <BrandMark />
      Salesforce Saver
    </Link>
  );
}

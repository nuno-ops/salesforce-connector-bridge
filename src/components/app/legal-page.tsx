import Link from "next/link";
import { Logo } from "@/components/app/logo";

export function LegalPage({
  title,
  updated,
  eyebrow = "Legal",
  children,
}: {
  title: string;
  updated: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-foreground/10">
        <div className="mx-auto flex h-[68px] max-w-3xl items-center justify-between gap-4 px-5">
          <Logo />
          <nav aria-label="Site" className="flex items-center gap-4 text-sm">
            <Link href="/guides" className="hover:underline">
              Guides
            </Link>
            <Link href="/login" className="whitespace-nowrap rounded-md bg-foreground px-3 py-2 font-semibold text-background">
              Free scan
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 py-14">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-title mt-4">{title}</h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Last updated {updated}</p>
        <div className="mt-8 flex flex-col gap-4 leading-relaxed [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_code]:font-mono [&_code]:text-xs [&_code]:break-words">
          {children}
        </div>
      </main>
    </div>
  );
}

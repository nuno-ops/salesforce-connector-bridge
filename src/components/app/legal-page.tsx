import { Logo } from "@/components/app/logo";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Logo />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-8 flex flex-col gap-4 leading-relaxed [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </main>
    </div>
  );
}

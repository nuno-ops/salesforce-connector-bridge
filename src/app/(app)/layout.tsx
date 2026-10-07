import Link from "next/link";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { requireWorkspace } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireWorkspace();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Logo href="/dashboard" />
            <nav className="hidden gap-4 text-sm text-muted-foreground sm:flex">
              <Link href="/dashboard" className="hover:text-foreground">
                Orgs
              </Link>
              <Link href="/settings" className="hover:text-foreground">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground md:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

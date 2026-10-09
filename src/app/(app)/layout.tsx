import Link from "next/link";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { requireWorkspace } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireWorkspace();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="no-print sticky top-0 z-20 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-6">
            <Logo href="/dashboard" />
            <nav className="hidden gap-6 text-[13px] font-bold text-foreground/75 sm:flex">
              <Link href="/dashboard" className="transition-colors hover:text-cobalt">
                Orgs
              </Link>
              <Link href="/settings" className="transition-colors hover:text-cobalt">
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-14">{children}</main>
    </div>
  );
}

import { BadgeDollarSign, Bot, Check, KeyRound, LineChart, ShieldCheck, UserX, Users } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

const CHECKS = [
  { icon: UserX, title: "Inactive users", body: "Full licenses assigned to people who haven't logged in for 30+ days." },
  { icon: Bot, title: "Integration users", body: "API-only accounts sitting on full licenses instead of the free Integration license." },
  { icon: Users, title: "Platform downgrades", body: "Users who never touch Opportunities, Leads or Cases and could move to Platform." },
  { icon: BadgeDollarSign, title: "Unassigned seats", body: "Licenses you pay for that nobody holds, plus unused managed-package seats." },
  { icon: LineChart, title: "Storage and sandboxes", body: "Storage close to its limit and Full Copy sandboxes you may not need." },
  { icon: KeyRound, title: "Connected apps", body: "An AI review of the third-party apps using your org, flagging overlap and dead weight." },
];

const PLANS = [
  {
    name: "Free scan",
    price: "$0",
    body: "Connect an org and see your total savings and top recommendations.",
    features: ["Total yearly savings", "Ranked recommendations", "Edition list prices or your own"],
  },
  {
    name: "One-off audit",
    price: "$99",
    body: "Everything you need for a renewal negotiation.",
    features: ["Every user behind the numbers", "CSV export and printable report", "AI review of connected apps", "Contract price import"],
  },
  {
    name: "Savings Monitor",
    price: "$39/mo",
    body: "Keep license waste from creeping back.",
    features: ["Everything in the audit", "Automatic weekly rescans", "Savings history per org", "Cancel any time"],
    featured: true,
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  const cta = user ? { href: "/dashboard", label: "Go to your orgs" } : { href: "/login", label: "Scan my org for free" };

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="#pricing">Pricing</a>
            </Button>
            <Button asChild size="sm">
              <Link href={cta.href}>{user ? "Dashboard" : "Sign in"}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center">
          <p className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">For Salesforce admins and finance teams</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Stop paying for Salesforce licenses nobody uses</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Connect your org with read-only access and get a priced list of inactive users, misassigned licenses and unused seats in
            about a minute.
          </p>
          <Button asChild size="lg">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
          <p className="text-sm text-muted-foreground">No credit card. Works with Professional, Enterprise and Unlimited editions.</p>
        </section>

        <section className="border-y border-border bg-card py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-10 text-center text-2xl font-semibold">What we check</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CHECKS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <Icon className="mt-1 size-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          {[
            ["1. Connect", "Sign in to Salesforce and approve read-only access. Production, sandbox and My Domain all work."],
            ["2. Scan", "We read users, licenses, permissions and limits. We never read or change your business records."],
            ["3. Save", "Act on a ranked list with direct links to each user, or take the report to your renewal."],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section id="pricing" className="border-t border-border bg-card py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-10 text-center text-2xl font-semibold">Pricing</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {PLANS.map((p) => (
                <Card key={p.name} className={p.featured ? "border-primary shadow-md" : ""}>
                  <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                    <p className="text-3xl font-bold">{p.price}</p>
                    <CardDescription>{p.body}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col gap-2 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check className="size-4 shrink-0 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center">
          <ShieldCheck className="size-8 text-primary" />
          <h2 className="text-2xl font-semibold">Built to be safe in your org</h2>
          <p className="text-muted-foreground">
            We request read-only API access, store tokens encrypted (AES-256), and only keep license and user metadata, never your
            accounts, contacts or deals. Disconnecting revokes access in Salesforce and deletes your scans.
          </p>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Salesforce Saver. Not affiliated with Salesforce, Inc.</p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

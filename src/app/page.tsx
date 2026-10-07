import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

const AUDIENCES = [
  {
    title: "Salesforce admins",
    body: "Clean up users and licenses with a ranked list and a direct link to every record.",
  },
  {
    title: "RevOps and IT",
    body: "Keep license usage in line with how the team actually works as people join, move and leave.",
  },
  {
    title: "Finance and procurement",
    body: "Go into your renewal with a priced, defensible list of what to cut.",
  },
];

const CHECKS = [
  { title: "Inactive users", body: "Paid licenses held by people who haven't logged in for 30 days or more." },
  { title: "Integration users", body: "API accounts on full licenses that could use the free Integration license." },
  { title: "Platform downgrades", body: "Users who never touch Opportunities, Leads or Cases and could move to Platform." },
  { title: "Unassigned seats", body: "Licenses you pay for that nobody holds, plus unused managed-package seats." },
  { title: "Storage and sandboxes", body: "Storage close to its limit and Full Copy sandboxes you may not need." },
  { title: "Connected apps", body: "An AI review of the third-party apps using your org, flagging overlap." },
];

const STEPS = [
  { title: "Connect", body: "Sign in to Salesforce and approve read-only access. Production, sandbox and My Domain logins all work." },
  { title: "Scan", body: "We read users, licenses, permissions and limits. Your business records are never read or changed." },
  { title: "Save", body: "Act on a ranked list with links to each user, or take a printable report to your renewal." },
];

const TRUST = [
  "Read-only API access that you approve in Salesforce",
  "No access to accounts, contacts, deals or files",
  "Tokens encrypted at rest with AES-256",
  "Disconnecting revokes access and deletes your scans",
];

const PLANS = [
  {
    name: "Free scan",
    price: "$0",
    cadence: "",
    body: "See what you could save.",
    features: ["Total yearly savings", "Ranked recommendations", "List prices or your own"],
    cta: "Start free",
  },
  {
    name: "One-off audit",
    price: "$99",
    cadence: "once",
    body: "Everything you need for a renewal.",
    features: ["Every user behind the numbers", "CSV export and printable report", "AI review of connected apps", "Prices read from your contract"],
    cta: "Start with a free scan",
  },
  {
    name: "Savings Monitor",
    price: "$39",
    cadence: "per month",
    body: "Keep license waste from coming back.",
    features: ["Everything in the audit", "Automatic weekly rescans", "Savings history per org", "Cancel any time"],
    cta: "Start with a free scan",
    featured: true,
  },
];

const FAQ = [
  {
    q: "What access do you need?",
    a: "Read-only API access through Salesforce's standard sign-in. You approve it in Salesforce and can revoke it at any time.",
  },
  {
    q: "Will it change anything in my org?",
    a: "No. Salesforce Saver only reads metadata such as users, licenses, permissions and limits.",
  },
  {
    q: "How are savings calculated?",
    a: "With list prices for your edition by default. Enter what you actually pay, or upload your order form, for figures that match your contract.",
  },
  {
    q: "Which editions are supported?",
    a: "Any org with API access, such as Enterprise and Unlimited. Professional Edition needs the API add-on.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  const primary = user ? { href: "/dashboard", label: "Go to your orgs" } : { href: "/login", label: "Start a free scan" };

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <a href="#checks" className="hover:text-foreground">
              What we check
            </a>
            <a href="#security" className="hover:text-foreground">
              Security
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {!user && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link href={primary.href}>{user ? "Dashboard" : "Start free scan"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 pt-20 pb-24 lg:grid-cols-[1.1fr_1fr] lg:pt-28">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Salesforce license optimization</p>
            <h1 className="mt-4 text-[2.75rem] leading-[1.05] font-semibold tracking-[-0.035em] sm:text-6xl">
              Stop paying for Salesforce licenses nobody uses.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Connect your org with read-only access. Salesforce Saver checks your users, licenses and permissions and gives you a
              priced, ranked list of savings in minutes.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href={primary.href}>
                  {primary.label} <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href="#how">How it works</a>
              </Button>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">Read-only access · Encrypted tokens · Disconnect any time</p>
          </div>
          <ReportPreview />
        </section>

        {/* Who it helps */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <SectionHeading eyebrow="Who it helps" title="Built for the people who own Salesforce spend." />
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {AUDIENCES.map((a) => (
                <div key={a.title} className="border-t border-foreground pt-5">
                  <h3 className="font-medium">{a.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What we check */}
        <section id="checks" className="border-t border-border bg-card">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <SectionHeading eyebrow="What we check" title="Six places license spend leaks." />
            <dl className="mt-12 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
              {CHECKS.map((c, i) => (
                <div key={c.title} className="border-b border-border py-7 sm:pr-8 lg:[&:nth-child(3n+2)]:px-8 lg:[&:nth-child(3n)]:pl-8">
                  <dt className="flex items-baseline gap-3 font-medium">
                    <span className="text-xs text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    {c.title}
                  </dt>
                  <dd className="mt-2 pl-7 text-[15px] leading-relaxed text-muted-foreground">{c.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <SectionHeading eyebrow="How it works" title="From sign-in to savings in three steps." />
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="flex size-8 items-center justify-center rounded-full border border-border text-sm font-medium tabular-nums">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-medium">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="border-t border-border bg-foreground text-background">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-background/60">Security</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Your org stays yours.</h2>
              <p className="mt-4 max-w-md leading-relaxed text-background/70">
                We only need to see who holds which license and what they can access. Nothing else.
              </p>
            </div>
            <ul className="flex flex-col divide-y divide-background/15 border-y border-background/15">
              {TRUST.map((t) => (
                <li key={t} className="flex items-start gap-3 py-4 text-[15px]">
                  <Check className="mt-0.5 size-4 shrink-0 text-background/60" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <SectionHeading eyebrow="Pricing" title="Start free. Pay when you act." />
            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
              {PLANS.map((p) => (
                <div key={p.name} className="flex flex-col bg-card p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{p.name}</h3>
                    {p.featured && <span className="text-xs font-medium text-positive">Ongoing</span>}
                  </div>
                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                    {p.cadence && <span className="text-sm text-muted-foreground">{p.cadence}</span>}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
                  <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={p.featured ? "default" : "outline"} className="mt-8">
                    <Link href={primary.href}>{p.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_2fr]">
            <SectionHeading eyebrow="Questions" title="Good to know." />
            <dl className="divide-y divide-border border-y border-border">
              {FAQ.map((f) => (
                <div key={f.q} className="py-6">
                  <dt className="font-medium">{f.q}</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 py-20 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">See what you could save.</h2>
              <p className="mt-3 text-muted-foreground">The first scan is free and takes a few minutes.</p>
            </div>
            <Button asChild size="lg">
              <Link href={primary.href}>
                {primary.label} <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Logo />
            <p>Independent product. Not affiliated with Salesforce, Inc.</p>
          </div>
          <nav className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">{title}</h2>
    </div>
  );
}

/** A simplified, static rendering of the report so visitors see the product, not stock art. */
function ReportPreview() {
  const rows = [
    { label: "Reclaim inactive licenses", tag: "High confidence", value: "$23,760" },
    { label: "Move integration users", tag: "Medium confidence", value: "$5,940" },
    { label: "Downgrade to Platform", tag: "Medium confidence", value: "$5,040" },
    { label: "Data storage is 82% full", tag: "Advice", value: "" },
  ];
  return (
    <figure className="w-full">
      <div className="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm font-medium">Acme Inc. · Enterprise Edition</p>
          <p className="text-xs text-muted-foreground">Savings report</p>
        </div>
        <div className="px-6 pt-6 pb-2">
          <p className="text-xs text-muted-foreground">Potential yearly savings</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-positive tabular-nums">$34,740</p>
        </div>
        <ul className="divide-y divide-border px-6">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-4 py-4 text-sm">
              <div>
                <p className="font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.tag}</p>
              </div>
              <p className="font-medium tabular-nums">{r.value}</p>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">Illustrative example with sample data</figcaption>
    </figure>
  );
}

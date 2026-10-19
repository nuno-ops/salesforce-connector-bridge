import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { stepRate } from "@/lib/analytics/core";
import { analyticsReport, isSiteOwner } from "@/lib/analytics/report";
import { requireUser } from "@/lib/auth";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

const RANGES = [7, 30, 90] as const;

const STEP_LABELS: Record<string, string> = {
  signed_up: "Signed up",
  org_connected: "Connected Salesforce",
  scan_succeeded: "Scan finished",
  scan_failed: "Scan failed",
  checkout_started: "Opened checkout",
  paid: "Paid",
};

function describe(name: string, props: Record<string, unknown> | null) {
  if (!props) return "";
  if (name === "scan_succeeded" && typeof props.savings === "number") return `${formatCurrency(props.savings)} a year found, ${props.seconds}s`;
  if (name === "paid" && typeof props.amount === "number") return formatCurrency(props.amount, String(props.currency ?? "USD"));
  if (name === "org_connected") return `${props.edition ?? ""}${props.sandbox ? ", sandbox" : ""}`;
  if (name === "checkout_started" && props.users) return `${props.users} users`;
  if (name === "signed_up" && props.method) return String(props.method);
  return "";
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  if (!isSiteOwner(user.email)) notFound();
  const requested = Number((await searchParams).days);
  const days = RANGES.find((r) => r === requested) ?? 30;
  const report = await analyticsReport(days);
  const t = report.totals;

  const funnel = [
    { label: "Visitors", value: t.visitors },
    { label: "Signed up", value: t.signedUp },
    { label: "Connected Salesforce", value: t.connected },
    { label: "Scan finished", value: t.scanned },
    { label: "Opened checkout", value: t.checkout },
    { label: "Paid", value: t.paid },
  ];
  const maxDaily = Math.max(1, ...report.daily.map((d) => d.visitors));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-foreground pb-8">
        <p className="eyebrow">Only you can see this</p>
        <h1 className="display-title">Analytics</h1>
        <div className="flex gap-4 text-sm font-bold">
          {RANGES.map((r) => (
            <Link key={r} href={`/admin?days=${r}`} className={cn("hover:text-cobalt", r === days ? "text-cobalt underline" : "text-foreground/60")}>
              Last {r} days
            </Link>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Cookie-free: a visitor is one browser on one day. Bots and your own account are left out. Counts of companies
          (sign-ups onwards) are workspaces that did that step in this period.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel</CardTitle>
          <CardDescription>
            {formatNumber(t.views)} page views · {formatNumber(t.calls)} &quot;Book a call&quot; clicks · {formatCurrency(t.revenue)} paid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TBody>
              {funnel.map((step, i) => {
                const rate = i > 0 ? stepRate(step.value, funnel[i - 1].value) : null;
                return (
                  <TR key={step.label}>
                    <TD>{step.label}</TD>
                    <TD className="text-right font-mono font-semibold">{formatNumber(step.value)}</TD>
                    <TD className="text-right text-muted-foreground">{rate === null ? "" : `${rate}% of previous step`}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where visitors came from</CardTitle>
            <CardDescription>The other site or utm_source of their first page. Everyone else came direct or from an app.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable head={["Source", "Visitors"]} rows={report.sources.map((s) => [s.source, formatNumber(s.visitors)])} empty="No outside visits yet." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Where sign-ups came from</CardTitle>
            <CardDescription>Matched to the same browser&apos;s first visit that day.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable head={["Source", "Sign-ups"]} rows={report.signupSources.map((s) => [s.source, formatNumber(s.signups)])} empty="No sign-ups yet." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visitors per day</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {report.daily.length === 0 && <p className="text-sm text-muted-foreground">No visits yet.</p>}
            {report.daily.map((d) => (
              <div key={d.day} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{d.day}</span>
                <span className="h-3 rounded-sm bg-cobalt" style={{ width: `${Math.max(2, (d.visitors / maxDaily) * 70)}%` }} />
                <span className="font-mono text-xs">{d.visitors}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top pages</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              head={["Page", "Views", "Visitors"]}
              rows={report.pages.map((p) => [p.path, formatNumber(p.views), formatNumber(p.visitors)])}
              empty="No visits yet."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest steps</CardTitle>
          <CardDescription>The last 30 sign-ups, connections, scans and payments, so you can follow up with people.</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleTable
            head={["When (UK)", "Who", "Step", "Detail"]}
            rows={report.recent.map((r) => [
              r.at.toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" }),
              r.email ?? "",
              STEP_LABELS[r.name] ?? r.name,
              describe(r.name, r.props),
            ])}
            empty="Nothing yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SimpleTable({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <Table>
      <THead>
        <TR>
          {head.map((h, i) => (
            <TH key={h} className={i > 0 && i === head.length - 1 && head.length < 4 ? "text-right" : undefined}>
              {h}
            </TH>
          ))}
        </TR>
      </THead>
      <TBody>
        {rows.map((row, i) => (
          <TR key={i}>
            {row.map((cell, j) => (
              <TD key={j} className={cn(j > 0 && head.length < 4 && "text-right font-mono", "break-all")}>
                {cell}
              </TD>
            ))}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/app/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { orgUnlocked } from "@/lib/billing/server";
import { lockedRecommendations, SAMPLE_CATEGORY } from "@/lib/billing/teaser";
import { calendlyUrl } from "@/lib/env";
import { getMarks } from "@/lib/marks";
import { summarizeContract } from "@/lib/savings/contract";
import { reportRecommendations } from "@/lib/savings/engine";
import { savedSoFar } from "@/lib/savings/marks";
import { latestScan } from "@/lib/scan";
import { findShare } from "@/lib/shares";
import { looksLikeToken } from "@/lib/tokens";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Shared savings report", robots: { index: false } };

/** Read-only results someone shared, e.g. with finance. Shows what the workspace itself can see, nothing more. */
export default async function SharedReportPage({ params }: PageProps<"/share/[token]">) {
  const { token } = await params;
  const found = looksLikeToken(token) ? await findShare(token) : null;
  const scan = found ? await latestScan(found.connection.id, { succeededOnly: true }) : null;

  if (!found || !scan?.result) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <Logo />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>This link has expired</CardTitle>
            <CardDescription>Shared reports stay open for 90 days. Ask whoever sent it for a new link.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const { connection } = found;
  const result = scan.result;
  const currency = result.prices.currency ?? "USD";
  const money = (n: number) => formatCurrency(n, currency);
  const [unlocked, marks] = await Promise.all([orgUnlocked(connection.workspaceId, scan), getMarks(connection.id)]);
  const { priced } = reportRecommendations(result.recommendations);
  const shown = unlocked ? priced : lockedRecommendations(priced);
  const marked = new Map(marks.map((m) => [m.recommendationId, m.status]));
  const saved = savedSoFar(marks, currency);
  const contract = summarizeContract(scan.snapshot?.salesforceAccount, scan.startedAt);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-10">
      <Logo />
      <div className="flex flex-col gap-3 border-b border-foreground pb-6">
        <p className="eyebrow">Shared by {found.sharedByEmail ?? "a colleague"} · read-only</p>
        <h1 className="display-title">{connection.orgName}</h1>
        <p className="text-sm text-muted-foreground">
          {connection.edition} · scanned {formatDate(scan.startedAt)}
          {contract && ` · contract renews ${formatDate(contract.endDate)}, notice by ${formatDate(contract.noticeBy)}`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-foreground bg-foreground text-background">
          <CardHeader>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#89887f]">Potential yearly savings</p>
            <p className="mt-3 text-5xl font-bold tracking-[-0.06em] text-lime">{money(result.annualSavings)}</p>
            <p className="text-sm text-[#96958d]">{money(result.monthlySavings)} per month</p>
          </CardHeader>
        </Card>
        {saved.count > 0 && (
          <Card>
            <CardHeader>
              <p className="eyebrow">Saved so far</p>
              <p className="mt-3 text-4xl font-bold tracking-[-0.05em] text-positive">{formatCurrency(saved.amount, saved.currency)}</p>
              <p className="text-sm text-muted-foreground">a year, from {saved.count} {saved.count === 1 ? "change" : "changes"} marked done</p>
            </CardHeader>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {shown.length === 0 && <p className="text-sm text-muted-foreground">No license waste found.</p>}
          {shown.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">
                  {r.title} {marked.get(r.id) === "done" && <Badge>Done</Badge>}
                  {marked.get(r.id) === "keep" && <Badge variant="muted">Keeping</Badge>}
                </p>
                {(unlocked || r.category === SAMPLE_CATEGORY) && <p className="text-sm text-muted-foreground">{r.detail}</p>}
              </div>
              <p className="shrink-0 font-mono font-semibold">{money(r.annualSavings)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About this report</CardTitle>
          <CardDescription>
            Salesforce Saver reads license and usage data from Salesforce (read-only) and prices what isn&apos;t used. Savings are yearly,
            and most can only be taken at renewal.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href={calendlyUrl()} target="_blank" rel="noreferrer">
              Book a free call
            </a>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">About Salesforce Saver</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

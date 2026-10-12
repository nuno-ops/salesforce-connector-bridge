import { AlertTriangle, Download, Printer, Settings2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton, UpgradeCard } from "@/components/app/upgrade-card";
import { ScanButton } from "@/components/report/scan-button";
import { UserTabs } from "@/components/report/user-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { appExchangeSearchUrl } from "@/lib/apps/appexchange";
import { reviewApps, UNUSED_DAYS, type AppVerdict } from "@/lib/apps/review";
import { requireConnection } from "@/lib/auth";
import { getAccess } from "@/lib/billing/server";
import { env } from "@/lib/env";
import { AWS_MARKETPLACE_CAP, awsCommitSaving, NOTICE_DAYS, summarizeContract, type ContractSummary } from "@/lib/savings/contract";
import { reportRecommendations, type Category, type Recommendation, type SavingsResult } from "@/lib/savings/engine";
import type { PriceBook } from "@/lib/savings/prices";
import { lastScanAttempt, latestScan, scanHistory } from "@/lib/scan";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { disconnectAction } from "./actions";

export const metadata: Metadata = { title: "Savings report" };

const CATEGORY_LABEL: Record<Category, string> = {
  inactive_users: "Inactive users",
  integration_users: "Integration users",
  platform_licenses: "Platform downgrades",
  unused_seats: "Unassigned seats",
  sandboxes: "Sandboxes",
  storage: "Storage",
  package_licenses: "Package seats",
  view_only_users: "View-only users",
  unused_apps: "Unused apps",
  connected_apps: "Connected apps",
  frozen_users: "Frozen users",
  duplicate_users: "Duplicate accounts",
  cross_org_users: "Paid in two orgs",
  service_cloud_users: "Service Cloud licenses",
  edition: "Edition",
};

const PRICE_BASIS: Record<PriceBook["source"], string> = {
  edition_default: "list prices for {edition}",
  invoices: "what your Salesforce invoices say you pay",
  manual: "your prices",
  contract: "your contract prices",
};

const confidenceVariant = { high: "default", medium: "warning", low: "muted" } as const;
const verdictVariant: Record<AppVerdict, "default" | "warning" | "danger" | "muted"> = {
  keep: "muted",
  review: "warning",
  consolidate: "warning",
  remove: "danger",
};

export default async function OrgPage({ params, searchParams }: PageProps<"/orgs/[connectionId]">) {
  const { connectionId } = await params;
  const { connected, checkout } = await searchParams;
  const { connection, workspace } = await requireConnection(connectionId);
  const [scan, lastAttempt, access] = await Promise.all([
    latestScan(connection.id, { succeededOnly: true }),
    lastScanAttempt(connection.id),
    getAccess(workspace.id),
  ]);
  const returnPath = `/orgs/${connection.id}`;
  const failed = lastAttempt?.status === "failed" ? lastAttempt : null;

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground pb-8">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard" className="eyebrow hover:text-cobalt">
          All orgs
        </Link>
        <h1 className="display-title">{connection.orgName}</h1>
        <p className="text-sm text-muted-foreground">
          {connection.edition}
          {connection.isSandbox ? " · Sandbox" : ""} · connected as {connection.sfUsername}
          {scan && ` · scanned ${formatDate(scan.startedAt)}`}
        </p>
      </div>
      {scan && <ScanButton connectionId={connection.id} />}
    </div>
  );

  if (connection.status !== "active") {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card>
          <CardHeader>
            <CardTitle>Reconnect this org</CardTitle>
            <CardDescription>Salesforce ended our session (the token was revoked or expired). Sign in again to keep scanning.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Reconnect</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!scan?.result) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card>
          <CardHeader>
            <CardTitle>{connected ? "Connected. Running your first scan…" : "Run your first scan"}</CardTitle>
            <CardDescription>We read users, licenses, permissions and limits. It usually takes under a minute.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {failed && <p className="text-sm text-danger">Last scan failed: {failed.error}</p>}
            <ScanButton connectionId={connection.id} auto={Boolean(connected) && !failed} label="Scan now" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = scan.result;
  const snapshot = scan.snapshot!;
  const currency = result.prices.currency ?? "USD";
  const money = (n: number) => formatCurrency(n, currency);
  const appReview = reviewApps(snapshot);
  const contract = summarizeContract(snapshot.salesforceAccount, scan.startedAt);
  // Results from before engine v3 have no app prices; fall back to the unpriced review.
  const connectedApps = result.connectedApps ?? appReview.tools.map((t) => ({ ...t, monthlyPrice: null, annualSavings: 0 }));
  const connectedSavings = connectedApps.reduce((a, t) => a + t.annualSavings, 0);
  const installedSavings = (result.apps ?? []).reduce((a, t) => a + (t.annualSavings ?? 0), 0);
  // Read from the live review so results saved before this flag existed get it too.
  const salesforceApps = new Set(appReview.tools.filter((t) => t.salesforce).map((t) => t.appName));
  const appPricesHref = `/orgs/${connection.id}/prices#apps`;
  const history = access.monitoring ? await scanHistory(connection.id) : [];
  const categories = (Object.entries(result.byCategory) as [Category, number][]).filter(([, v]) => v > 0);
  const { priced, needsPrice } = reportRecommendations(result.recommendations);
  // Only apps with something to cancel or consolidate; the rest are counted, not listed.
  const flaggedConnected = connectedApps.filter((t) => t.verdict === "remove" || t.verdict === "consolidate");
  const idleApps = (result.apps ?? []).filter((a) => a.status === "idle");
  const otherAppCount = (result.apps?.length ?? 0) - idleApps.length;
  const userTabs = [
    { key: "frozen", label: "Frozen", users: result.users.frozen ?? [] },
    { key: "duplicate", label: "Duplicates", users: result.users.duplicate ?? [] },
    { key: "inactive", label: "Inactive", users: result.users.inactive },
    { key: "integration", label: "Integration", users: result.users.integration },
    { key: "platform", label: "Platform candidates", users: result.users.platform },
    { key: "viewOnly", label: "View-only", users: result.users.viewOnly ?? [] },
    { key: "crossOrg", label: "Paid in two orgs", users: result.users.crossOrg ?? [] },
    // Unpriced Service Cloud users would show a zero saving; they're listed once a price is entered.
    { key: "serviceCloud", label: "Service Cloud", users: (result.users.serviceCloud ?? []).filter((u) => u.annualSavings > 0) },
  ].filter((t) => t.users.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {header}

      {checkout === "success" && (
        <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">Thanks! Your purchase is being applied; refresh in a moment if the report is still locked.</p>
      )}
      {failed && failed.startedAt > scan.startedAt && (
        <p className="flex items-center gap-2 rounded-md bg-warning-bg p-3 text-sm text-warning">
          <AlertTriangle className="size-4" /> The latest rescan failed ({failed.error}). Showing the previous results.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-foreground bg-foreground text-background md:col-span-1 print:border-border print:bg-card print:text-foreground">
          <CardHeader>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#89887f]">Potential yearly savings</p>
            <p className="mt-4 text-5xl font-bold tracking-[-0.06em] text-lime print:text-positive">{money(result.annualSavings)}</p>
            <p className="text-sm text-[#96958d]">{money(result.monthlySavings)} per month</p>
          </CardHeader>
          <CardContent className="flex flex-col text-sm">
            {categories.map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-[#2d2d29] py-3 first:border-t">
                <span className="text-[#b5b3aa]">{CATEGORY_LABEL[key]}</span>
                <span className="font-mono font-semibold">{money(value)}</span>
              </div>
            ))}
            <p className="mt-4 text-xs text-[#96958d]">
              Based on {PRICE_BASIS[result.prices.source].replace("{edition}", connection.edition ?? "your edition")}: {money(result.prices.fullMonthly)}
              /user/month full, {money(result.prices.platformMonthly)} Platform.{" "}
              <Link href={`/orgs/${connection.id}/prices`} className="text-lime hover:underline print:text-cobalt">
                Edit prices
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {priced.length === 0 && <p className="text-sm text-muted-foreground">No license waste found. Your org is in good shape.</p>}
            {priced.map((r) => (
              <RecommendationRow key={r.id} rec={r} currency={currency} />
            ))}
            {needsPrice.length > 0 && (
              <div className="py-3 last:pb-0">
                <p className="text-sm font-medium">
                  Add a price to see the saving{" "}
                  <Link href={`/orgs/${connection.id}/prices`} className="text-cobalt hover:underline">
                    Enter prices
                  </Link>
                </p>
                <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                  {needsPrice.map((r) => (
                    <li key={r.id}>{r.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {contract && <ContractCard contract={contract} result={result} pricesHref={`/orgs/${connection.id}/prices#apps`} />}

      {!access.fullReport && <UpgradeCard returnPath={returnPath} auditHours={env().AUDIT_ACCESS_HOURS} />}

      {access.fullReport && (
        <>
          <div className="no-print flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/orgs/${connection.id}/export`}>
                <Download /> Export CSV
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/orgs/${connection.id}/print`} target="_blank">
                <Printer /> Printable report
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/orgs/${connection.id}/prices`}>
                <Settings2 /> Prices
              </Link>
            </Button>
          </div>

          {userTabs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Users to act on</CardTitle>
                <CardDescription>Names open the user record in Salesforce.</CardDescription>
              </CardHeader>
              <CardContent>
                <UserTabs instanceUrl={connection.instanceUrl} tabs={userTabs} currency={currency} />
              </CardContent>
            </Card>
          )}

          {flaggedConnected.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Connected apps</CardTitle>
              <CardDescription>
                Reviewed from how often each app&apos;s access was used. Apps unused for {UNUSED_DAYS}+ days, apps doing the same job,
                and apps only one person uses are flagged.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {connectedSavings > 0 && (
                <p className="text-sm">
                  <span className="font-mono text-lg font-semibold text-cobalt">{money(connectedSavings)}</span> a year from
                  cancelling unused apps and consolidating overlapping ones.
                </p>
              )}
              {connectedApps.length > flaggedConnected.length && (
                <p className="text-sm text-muted-foreground">
                  {connectedApps.length - flaggedConnected.length} other connected {connectedApps.length - flaggedConnected.length === 1 ? "app looks" : "apps look"} fine.
                </p>
              )}
                <Table>
                  <THead>
                    <tr>
                      <TH>App</TH>
                      <TH className="text-right">Yearly saving</TH>
                      <TH>Category</TH>
                      <TH className="text-right">Users</TH>
                      <TH>Verdict</TH>
                      <TH>Why</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {flaggedConnected.map((t) => (
                      <TR key={t.appName}>
                        <TD className="font-medium">{t.appName}</TD>
                        <TD className="text-right whitespace-nowrap">
                          <AppSaving saving={t.annualSavings} priced={t.monthlyPrice !== null} flagged={!salesforceApps.has(t.appName) && (t.verdict === "remove" || t.verdict === "consolidate")} href={appPricesHref} currency={currency} />
                        </TD>
                        <TD>{t.category}</TD>
                        <TD className="text-right">{formatNumber(t.users)}</TD>
                        <TD>
                          <Badge variant={verdictVariant[t.verdict]}>{t.verdict}</Badge>
                        </TD>
                        <TD>
                          {t.reason}
                          {t.alternative && <div className="text-xs text-muted-foreground">Native option: {t.alternative}</div>}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
            </CardContent>
          </Card>
          )}

          {idleApps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Unused installed apps</CardTitle>
                <CardDescription>
                  AppExchange apps where nobody created or edited a record in 90+ days: worth cancelling at renewal. Savings use the
                  vendor&apos;s list price where we know it, until you enter your own.
                  {otherAppCount > 0 && ` ${otherAppCount} other installed ${otherAppCount === 1 ? "app is" : "apps are"} in use or couldn't be checked.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {installedSavings > 0 && (
                  <p className="text-sm">
                    <span className="font-mono text-lg font-semibold text-cobalt">{money(installedSavings)}</span> a year from
                    cancelling apps nobody uses.
                  </p>
                )}
                <Table>
                  <THead>
                    <tr>
                      <TH>App</TH>
                      <TH className="text-right">Yearly saving</TH>
                      <TH className="text-right">Seats used</TH>
                      <TH>Last activity</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {idleApps.map((a) => (
                      <TR key={a.namespace ?? a.name}>
                        <TD>
                          <span className="font-medium">{a.name}</span>
                          {a.namespace && <div className="font-mono text-xs text-muted-foreground">{a.namespace}</div>}
                        </TD>
                        <TD className="text-right whitespace-nowrap">
                          <AppSaving
                            saving={a.annualSavings ?? 0}
                            priced={a.monthlyPrice != null}
                            flagged
                            href={a.namespace ? appPricesHref : null}
                            currency={currency}
                          />
                          {a.priceSource === "list" && (a.annualSavings ?? 0) > 0 && a.listPrice && currency === "USD" && (
                            <a
                              href={a.listPrice.source}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-xs text-muted-foreground hover:text-cobalt"
                              title={`${a.listPrice.tier}, checked ${a.listPrice.checked}`}
                            >
                              List price ↗
                            </a>
                          )}
                          {a.namespace && a.monthlyPrice == null && (!a.listPrice || currency !== "USD") && (
                            <a
                              href={appExchangeSearchUrl(a.name)}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-xs text-muted-foreground hover:text-cobalt"
                            >
                              List price ↗
                            </a>
                          )}
                        </TD>
                        <TD className="text-right">
                          {a.seats ? (a.seats.allowed < 0 ? "Site license" : `${formatNumber(a.seats.used)} / ${formatNumber(a.seats.allowed)}`) : "—"}
                        </TD>
                        <TD className="whitespace-nowrap">{a.lastActivity ? formatDate(a.lastActivity) : "No records"}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {result.edition && result.edition.annualSavings > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Unlimited Edition fit</CardTitle>
                <CardDescription>
                  What Unlimited adds over Enterprise, and whether this org uses it.{" "}
                  {result.edition.blocked
                    ? "This org needs Unlimited's higher limits."
                    : result.edition.annualSavings > 0
                      ? `Moving ${formatNumber(result.edition.seats)} full licenses to Enterprise at renewal could save ${money(result.edition.annualSavings)} a year.`
                      : "We couldn't read enough to price a move to Enterprise."}{" "}
                  Premier support also comes with Unlimited; we can&apos;t see whether you use it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <THead>
                    <tr>
                      <TH>Unlimited extra</TH>
                      <TH>Needed?</TH>
                      <TH>Why</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {result.edition.signals.map((sig) => (
                      <TR key={sig.key}>
                        <TD className="font-medium">{sig.label}</TD>
                        <TD>
                          <Badge variant={sig.needsUnlimited === null ? "muted" : sig.needsUnlimited ? "warning" : "default"}>
                            {sig.needsUnlimited === null ? "Can't tell" : sig.needsUnlimited ? "Yes" : "No"}
                          </Badge>
                        </TD>
                        <TD>{sig.detail}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          )}

        </>
      )}

      {(access.monitoring || access.billingEnabled) && (
      <Card className="no-print">
        <CardHeader>
          <CardTitle>Monitoring</CardTitle>
          <CardDescription>
            {access.monitoring
              ? "We rescan this org every week and keep the history here."
              : "Subscribe to rescan automatically every week and track savings over time."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {access.monitoring ? (
            <Table>
              <THead>
                <tr>
                  <TH>Scan</TH>
                  <TH>Type</TH>
                  <TH className="text-right">Yearly savings</TH>
                </tr>
              </THead>
              <TBody>
                {history.map((h) => (
                  <TR key={h.id}>
                    <TD>{formatDate(h.startedAt)}</TD>
                    <TD className="capitalize">{h.trigger}</TD>
                    <TD className="text-right">{money(h.annualSavings ?? 0)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <CheckoutButton product="monitor" returnPath={returnPath} variant="outline">
              Start monitoring · $39/month
            </CheckoutButton>
          )}
        </CardContent>
      </Card>
      )}

      {result.notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">What we couldn&apos;t check</CardTitle>
            <CardDescription>The total may be missing savings from these.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {result.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <form action={disconnectAction.bind(null, connection.id)} className="no-print">
        <Button variant="link" className="px-0 text-danger" type="submit">
          Disconnect this org and delete its scans
        </Button>
      </form>
    </div>
  );
}

function RecommendationRow({ rec, currency }: { rec: Recommendation; currency: string }) {
  const money = (n: number) => formatCurrency(n, currency);
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <p className="font-medium">
          {rec.title} <Badge variant={confidenceVariant[rec.confidence]}>{rec.confidence} confidence</Badge>
        </p>
        <p className="text-sm text-muted-foreground">{rec.detail}</p>
      </div>
      <p className="shrink-0 text-right font-mono font-semibold">{rec.advisory ? <span className="text-xs font-normal text-muted-foreground">Advice</span> : money(rec.annualSavings)}</p>
    </div>
  );
}


/** Dollar saving for an app row; flagged apps without a price link to where the price is entered. */
function AppSaving({
  saving,
  priced,
  flagged,
  href,
  currency,
}: {
  saving: number;
  priced: boolean;
  flagged: boolean;
  href: string | null;
  currency: string;
}) {
  const money = (n: number) => formatCurrency(n, currency);
  if (saving > 0) return <span className="font-mono font-semibold text-cobalt">{money(saving)}</span>;
  if (flagged && !priced && href)
    return (
      <Link href={href} className="text-xs font-semibold text-cobalt underline-offset-4 hover:underline">
        Add price
      </Link>
    );
  return <span className="text-muted-foreground">—</span>;
}

/** Seats a renewal can drop: unassigned ones, plus the ones flagged users free up when deactivated. */
const SEAT_CATEGORIES: Category[] = ["unused_seats", "frozen_users", "inactive_users", "duplicate_users", "cross_org_users", "integration_users"];

function ContractCard({ contract, result, pricesHref }: { contract: ContractSummary; result: SavingsResult; pricesHref: string }) {
  const currency = result.prices.currency ?? "USD";
  const spend = contract.annualSpend;
  const annualSavings = result.annualSavings;
  const share = spend && spend.currency === currency && spend.amount > 0 ? annualSavings / spend.amount : null;
  const seatsToDrop =
    result.recommendations.filter((r) => r.category === "unused_seats").reduce((a, r) => a + r.count, 0) +
    [result.users.frozen, result.users.inactive, result.users.duplicate, result.users.crossOrg, result.users.integration]
      .flat()
      .filter((u) => u && u.annualSavings > 0).length;
  const seatSavings = SEAT_CATEGORIES.reduce((a, c) => a + result.byCategory[c], 0);
  const rise = contract.priceChange && contract.priceChange.rate >= 0.01 ? contract.priceChange : null;
  const nextRise = rise && spend ? spend.amount * rise.rate : null;
  // AWS numbers are entered in the report currency, so they only compare with a bill in the same currency.
  const awsSaving = spend && spend.currency === currency ? awsCommitSaving(spend.amount, result.prices.apps?.addOns) : null;
  const day = (d: string) => formatDate(`${d}T00:00:00`);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Salesforce contract</CardTitle>
        <CardDescription>
          Read from your Salesforce account{contract.number ? ` (contract ${contract.number})` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 text-sm md:grid-cols-2">
        {spend && (
          <div className="flex flex-col gap-1">
            <p className="eyebrow">What you pay Salesforce</p>
            <p className="font-mono text-3xl font-semibold">
              {formatCurrency(spend.amount, spend.currency)}
              <span className="text-base font-normal text-muted-foreground"> a year</span>
            </p>
            <p className="text-muted-foreground">
              {spend.basis === "invoices_on_contract"
                ? `From your ${contract.billingFrequency?.toLowerCase()} invoices on this contract.`
                : "Invoices from the last 12 months."}
              {share !== null && annualSavings > 0 && ` The savings above are ${Math.max(1, Math.round(share * 100))}% of your bill.`}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className="eyebrow">Renewal</p>
          <p className="font-mono text-3xl font-semibold">
            {day(contract.endDate)}
            <span className="text-base font-normal text-muted-foreground"> · {formatNumber(contract.daysLeft)} days</span>
          </p>
          <p className="text-muted-foreground">
            {contract.autoRenew === true ? "Auto-renews. " : contract.autoRenew === false ? "Doesn't auto-renew. " : ""}
            Tell your account executive about seat cuts by <strong className="text-foreground">{day(contract.noticeBy)}</strong>.
            Salesforce&apos;s standard terms ask for {NOTICE_DAYS} days&apos; notice; check your order form for yours.
          </p>
        </div>
        {seatsToDrop > 0 && seatSavings > 0 && (
          <div className="flex flex-col gap-1">
            <p className="eyebrow">Seats to drop at renewal</p>
            <p className="font-mono text-3xl font-semibold">
              {formatNumber(seatsToDrop)}
              <span className="text-base font-normal text-muted-foreground"> · {formatCurrency(seatSavings, currency)} a year</span>
            </p>
            <p className="text-muted-foreground">
              Unassigned seats, plus the seats frozen, inactive, duplicate, two-org and integration users free up once you deactivate or move
              them. Do that before {day(contract.noticeBy)} and ask for the lower count at renewal.
            </p>
          </div>
        )}
        {rise && (
          <div className="flex flex-col gap-1">
            <p className="eyebrow">Price increase to negotiate</p>
            <p className="font-mono text-3xl font-semibold">
              +{Math.round(rise.rate * 100)}%
              {nextRise !== null && spend && (
                <span className="text-base font-normal text-muted-foreground"> · {formatCurrency(nextRise, spend.currency)} a year</span>
              )}
            </p>
            <p className="text-muted-foreground">
              Your invoice of {day(rise.latest)} is {Math.round(rise.rate * 100)}% higher than the one from {day(rise.yearEarlier)}. That can be a
              price rise or seats you added. If the same rise comes at renewal, your bill grows by about that much a year: ask your account
              executive to cap the renewal increase before {day(contract.noticeBy)}
              {contract.autoRenew === true ? ", because an auto-renewing contract renews on Salesforce's terms if you don't." : "."}
            </p>
          </div>
        )}
        {spend && spend.currency === currency && (
          <div className="flex flex-col gap-1">
            <p className="eyebrow">Option to save: pay through AWS</p>
            {awsSaving !== null ? (
              <p className="font-mono text-3xl font-semibold">
                {formatCurrency(awsSaving, currency)}
                <span className="text-base font-normal text-muted-foreground"> a year</span>
              </p>
            ) : (
              <p className="font-semibold">
                <Link href={pricesHref} className="text-cobalt hover:underline">
                  Add your AWS numbers to see the saving
                </Link>
              </p>
            )}
            <p className="text-muted-foreground">
              A possible approach: we can&apos;t see whether your company uses AWS. Salesforce sells through AWS Marketplace in the US, UK,
              much of the EU, Canada, Australia, India, Chile, Colombia and Mexico. If your company has an AWS spend commitment it expects to
              leave partly unused, buying your renewal there counts your Salesforce bill toward it, so money you&apos;d lose to AWS pays for
              Salesforce instead.{" "}
              {awsSaving !== null
                ? `That's the smallest of your Salesforce bill, ${AWS_MARKETPLACE_CAP * 100}% of your AWS commitment (AWS's usual Marketplace cap) and the amount you expect to leave unused.`
                : `The saving is at most the commitment you'd leave unused, and AWS usually counts Marketplace purchases up to ${AWS_MARKETPLACE_CAP * 100}% of the commitment.`}{" "}
              Only listings marked &quot;Deployed on AWS&quot; count. Ask your account executive for an AWS Marketplace private offer before{" "}
              {day(contract.noticeBy)}. Not added to your savings total.{" "}
              <Link href="/settings#expert-review" className="text-foreground underline underline-offset-2 hover:text-cobalt">
                Questions? Book an expert review.
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

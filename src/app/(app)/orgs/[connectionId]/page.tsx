import { AlertTriangle, Download, Lock, Printer, Settings2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExpertCallCard } from "@/components/app/expert-call";
import { UpgradeCard } from "@/components/app/upgrade-card";
import { ScanButton } from "@/components/report/scan-button";
import { UserTabs } from "@/components/report/user-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { appExchangeSearchUrl } from "@/lib/apps/appexchange";
import { loadLookups } from "@/lib/apps/aws-marketplace";
import { CLOUD_LABEL, type LookupResults } from "@/lib/apps/marketplaces";
import { reviewApps, UNUSED_DAYS, type AppVerdict } from "@/lib/apps/review";
import { requireConnection } from "@/lib/auth";
import { reportUnlocked } from "@/lib/billing/access";
import { licensedUsers, tierLabel, unlockTier } from "@/lib/billing/pricing";
import { lockedRecommendations, SAMPLE_CATEGORY } from "@/lib/billing/teaser";
import { accessDays, getAccess } from "@/lib/billing/server";
import { env } from "@/lib/env";
import { nonprofitSaving, POWER_OF_US_LICENSES, PREMIER_SHARE_OF_LICENSES, premierSaving, type CompanyAnswers } from "@/lib/savings/answers";
import { cloudOptions, renewalSeats, resellerQuoteApps, type CloudOption } from "@/lib/savings/cloud-options";
import { AWS_MARKETPLACE_CAP, NOTICE_DAYS, summarizeContract, type ContractSummary } from "@/lib/savings/contract";
import { contractStrategies, type Strategy } from "@/lib/savings/strategies";
import { reportRecommendations, type Category, type Recommendation, type SavingsResult } from "@/lib/savings/engine";
import type { OrgSnapshot } from "@/lib/salesforce/types";
import { ENTERPRISE_SHARE_OF_UNLIMITED, type PriceBook } from "@/lib/savings/prices";
import { lastScanAttempt, latestScan, lookupNames, scanHistory } from "@/lib/scan";
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
  const running = lastAttempt?.status === "running";

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
      {scan && <ScanButton connectionId={connection.id} running={running} />}
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
            <CardDescription>We read users, licenses, permissions and limits. It usually takes under a minute, a few minutes for big orgs.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {failed && <p className="text-sm text-danger">Last scan failed: {failed.error}</p>}
            <ScanButton connectionId={connection.id} auto={Boolean(connected) && !failed} running={running} label="Scan now" />
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
  // Saved marketplace lookups for this org's apps; none until the lookup table exists or keys are set.
  const lookups: LookupResults = contract ? await loadLookups(lookupNames(result)).catch(() => new Map()) : new Map();
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
  const answersHref = `/welcome?next=${encodeURIComponent(`/orgs/${connection.id}`)}`;
  const strategies = contract
    ? contractStrategies({ contract, result, snapshot, edition: connection.edition, answers: workspace.answers, lookups })
    : [];
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
  const tier = unlockTier(licensedUsers(snapshot));
  const unlocked = reportUnlocked(access, { users: licensedUsers(snapshot), annualSavings: result.annualSavings, price: tier.price });
  // Inactive users are the free sample; the rest are counted towards what the unlock reveals.
  const sampleTabs = userTabs.filter((t) => t.key === "inactive");
  const sampleIds = new Set(sampleTabs.flatMap((t) => t.users.map((u) => u.id)));
  const flaggedUserCount = new Set(userTabs.flatMap((t) => t.users.map((u) => u.id)).filter((id) => !sampleIds.has(id))).size;
  const shownRecommendations = unlocked ? priced : lockedRecommendations(priced);
  const lockedItems = [
    flaggedUserCount > 0 && `${formatNumber(flaggedUserCount)} more ${flaggedUserCount === 1 ? "user" : "users"} to act on, by name`,
    flaggedConnected.length + idleApps.length > 0 &&
      `${formatNumber(flaggedConnected.length + idleApps.length)} ${flaggedConnected.length + idleApps.length === 1 ? "app" : "apps"} to cancel or consolidate`,
    strategies.length > 0 && `${strategies.length} renewal buying ${strategies.length === 1 ? "option" : "options"}`,
    result.edition && result.edition.annualSavings > 0 && "Edition fit check",
    "CSV export and printable report",
  ].filter((x): x is string => Boolean(x));

  return (
    <div className="flex flex-col gap-6">
      {header}

      {checkout === "success" && (
        <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">Thanks! Your purchase is being applied; refresh in a moment if the report is still locked.</p>
      )}
      {checkout === "preview" && (
        <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">
          Preview: the full report is unlocked with no charge. A customer would see this after paying.{" "}
          <Link href="/settings" className="underline">
            Lock it again in Settings
          </Link>
        </p>
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
            {shownRecommendations.map((r) => (
              <RecommendationRow key={r.id} rec={r} currency={currency} showDetail={unlocked || r.category === SAMPLE_CATEGORY} />
            ))}
            {strategies.length > 0 && !unlocked && (
              <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
                <div>
                  <p className="font-medium">
                    {strategies.length} {strategies.length === 1 ? "way" : "ways"} to pay less at renewal <Badge variant="muted">Options</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">Buying options for your next Salesforce contract, not in the total.</p>
                </div>
                <a href="#unlock" className="flex shrink-0 items-center gap-1 text-xs font-semibold text-cobalt hover:underline">
                  <Lock className="size-3" /> Unlock
                </a>
              </div>
            )}
            {strategies.length > 0 && unlocked && (
              <div className="flex flex-col py-3 last:pb-0">
                <p className="eyebrow">
                  At renewal: buying options, not in the total{" "}
                  {unlocked && (
                    <a href="#contract" className="normal-case tracking-normal text-cobalt hover:underline">
                      Details
                    </a>
                  )}
                </p>
                {strategies.map((st) => (
                  <StrategyRow key={st.id} strategy={st} currency={currency} answersHref={answersHref} pricesHref={appPricesHref} showDetail={unlocked} />
                ))}
              </div>
            )}
            {needsPrice.length > 0 && !unlocked && (
              <p className="py-3 text-sm text-muted-foreground last:pb-0">
                {needsPrice.length} more {needsPrice.length === 1 ? "saving shows" : "savings show"} once you{" "}
                <Link href={`/orgs/${connection.id}/prices`} className="text-cobalt hover:underline">
                  enter your prices
                </Link>
                .
              </p>
            )}
            {needsPrice.length > 0 && unlocked && (
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

      {!unlocked && (
        <UpgradeCard
          returnPath={returnPath}
          connectionId={connection.id}
          price={tier.price}
          sizeLabel={tierLabel(tier)}
          access={accessDays(env().AUDIT_ACCESS_HOURS)}
          locked={lockedItems}
        />
      )}

      {!unlocked && sampleTabs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Free sample: inactive users</CardTitle>
            <CardDescription>
              Names open the user record in Salesforce.
              {flaggedUserCount > 0 && ` The other ${formatNumber(flaggedUserCount)} users to act on are in the full report.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserTabs instanceUrl={connection.instanceUrl} tabs={sampleTabs} currency={currency} />
          </CardContent>
        </Card>
      )}

      <ExpertCallCard returnPath={returnPath} />

      {contract && !unlocked && (
        <Card>
          <CardHeader>
            <CardTitle>Your Salesforce renewal</CardTitle>
            <CardDescription>
              Renews {formatDate(`${contract.endDate}T00:00:00`)}, {formatNumber(contract.daysLeft)} days from now. Tell your account
              executive about seat cuts by <strong className="text-foreground">{formatDate(`${contract.noticeBy}T00:00:00`)}</strong>{" "}
              (Salesforce&apos;s standard {NOTICE_DAYS} days&apos; notice).
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {contract && unlocked && (
        <ContractCard
          contract={contract}
          result={result}
          snapshot={snapshot}
          edition={connection.edition}
          answers={workspace.answers}
          lookups={lookups}
          pricesHref={`/orgs/${connection.id}/prices#apps`}
          answersHref={`/welcome?next=${encodeURIComponent(returnPath)}`}
        />
      )}

      {unlocked && (
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
                  {result.edition.annualSavings > 0 &&
                    `That assumes Standard support: Unlimited includes Premier Success, which costs ${PREMIER_SHARE_OF_LICENSES * 100}% of license fees on Enterprise. If you'd keep Premier, the saving is about ${money(premierKeptSaving(result.edition.annualSavings))} a year.`}
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

      {access.monitoring && (
      <Card className="no-print">
        <CardHeader>
          <CardTitle>Monitoring</CardTitle>
          <CardDescription>We rescan this org every week and keep the history here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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

function StrategyRow({
  strategy,
  currency,
  answersHref,
  pricesHref,
  showDetail,
}: {
  strategy: Strategy;
  currency: string;
  answersHref: string;
  pricesHref: string;
  showDetail: boolean;
}) {
  const link = "text-xs font-semibold text-cobalt underline-offset-4 hover:underline";
  return (
    <div className="flex items-start justify-between gap-4 pt-3">
      <div>
        <p className="font-medium">
          {strategy.title} <Badge variant="muted">Option</Badge>
        </p>
        {showDetail && <p className="text-sm text-muted-foreground">{strategy.detail}</p>}
      </div>
      <p className="shrink-0 text-right font-mono font-semibold">
        {strategy.amount !== null ? (
          <>
            {formatCurrency(strategy.amount, currency)}
            <span className="block text-xs font-normal text-muted-foreground">a year</span>
          </>
        ) : strategy.missing === "answers" ? (
          <Link href={answersHref} className={link}>
            Add your numbers
          </Link>
        ) : strategy.missing === "prices" ? (
          <Link href={pricesHref} className={link}>
            Add your numbers
          </Link>
        ) : strategy.missing === "negotiated" ? (
          <span className="text-xs font-normal text-muted-foreground">Ask for a quote</span>
        ) : (
          <span className="text-xs font-normal text-muted-foreground">Advice</span>
        )}
      </p>
    </div>
  );
}

function RecommendationRow({ rec, currency, showDetail }: { rec: Recommendation; currency: string; showDetail: boolean }) {
  const money = (n: number) => formatCurrency(n, currency);
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <p className="font-medium">
          {rec.title} <Badge variant={confidenceVariant[rec.confidence]}>{rec.confidence} confidence</Badge>
        </p>
        {showDetail && <p className="text-sm text-muted-foreground">{rec.detail}</p>}
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


/**
 * The Unlimited-to-Enterprise saving if the customer buys Premier on Enterprise: the saving is
 * seats × (Unlimited − Enterprise), and Premier adds 30% of the Enterprise price back.
 */
function premierKeptSaving(annualSavings: number) {
  const share = ENTERPRISE_SHARE_OF_UNLIMITED;
  return Math.max(0, annualSavings - (annualSavings * share * PREMIER_SHARE_OF_LICENSES) / (1 - share));
}

function ContractCard({
  contract,
  result,
  snapshot,
  edition,
  answers,
  lookups,
  pricesHref,
  answersHref,
}: {
  contract: ContractSummary;
  result: SavingsResult;
  snapshot: OrgSnapshot;
  edition: string;
  answers: CompanyAnswers | null;
  lookups: LookupResults;
  pricesHref: string;
  answersHref: string;
}) {
  const currency = result.prices.currency ?? "USD";
  const spend = contract.annualSpend;
  const annualSavings = result.annualSavings;
  const share = spend && spend.currency === currency && spend.amount > 0 ? annualSavings / spend.amount : null;
  const { seats: seatsToDrop, annualSavings: seatSavings } = renewalSeats(result);
  const rise = contract.priceChange && contract.priceChange.rate >= 0.01 ? contract.priceChange : null;
  const nextRise = rise && spend ? spend.amount * rise.rate : null;
  // Cloud numbers are entered in the report currency, so they only compare with a bill in the same currency.
  // AWS numbers entered for this org win over the ones given at sign-up.
  const clouds = cloudOptions(result, answers, spend && spend.currency === currency ? spend.amount : null, lookups);
  const awsSaving = clouds.aws?.saving ?? null;
  const resellerApps = resellerQuoteApps(result, lookups);
  const premier = premierSaving(answers, edition, spend && spend.currency === currency ? spend.amount : null);
  const nonprofit = nonprofitSaving(
    answers,
    snapshot,
    result.prices.fullMonthly,
    (result.apps ?? []).flatMap((a) => (a.namespace ? [a.namespace] : [])),
  );
  const day = (d: string) => formatDate(`${d}T00:00:00`);
  return (
    <Card id="contract" className="scroll-mt-6">
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
            {answers?.agentforce === "yes" && (
              <p className="text-muted-foreground">
                <strong className="text-foreground">Planning to buy Agentforce?</strong> Salesforce&apos;s Flex Agreement lets you convert
                user licenses into Flex Credits, the currency Agentforce is billed in. Ask your account executive to turn these{" "}
                {formatNumber(seatsToDrop)} seats ({formatCurrency(seatSavings, currency)} a year) into credits instead of paying for new
                ones. It moves money you already spend rather than cutting the bill, so it&apos;s not added again to your savings total.
              </p>
            )}
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
        {premier && (
          <div className="flex flex-col gap-1">
            <p className="eyebrow">Option to save: Premier Success</p>
            {premier.amount !== null ? (
              <p className="font-mono text-3xl font-semibold">
                {formatCurrency(premier.amount, currency)}
                <span className="text-base font-normal text-muted-foreground"> a year</span>
              </p>
            ) : (
              <p className="font-semibold">
                <Link href={answersHref} className="text-cobalt hover:underline">
                  {answers?.premier === "yes" ? "Add what Premier costs to see the saving" : "Paying for Premier Success? Tell us to see the saving"}
                </Link>
              </p>
            )}
            <p className="text-muted-foreground">
              Premier Success is Salesforce&apos;s paid support plan, priced at {PREMIER_SHARE_OF_LICENSES * 100}% of your license fees, and
              often renewed without anyone checking it&apos;s still used. Standard Success comes free with every license.{" "}
              {premier.estimated
                ? `This estimate assumes Premier covers all your licenses (${PREMIER_SHARE_OF_LICENSES * 100}% on top of license fees is about ${Math.round((PREMIER_SHARE_OF_LICENSES / (1 + PREMIER_SHARE_OF_LICENSES)) * 100)}% of your bill); your order form has the exact line. `
                : answers?.premier === "unsure" || !answers?.premier
                  ? "Your order form shows it as its own line if you have it. "
                  : ""}
              If you rarely use 24/7 support or the Admin services, drop it or negotiate it down before {day(contract.noticeBy)}. Not added
              to your savings total.
            </p>
          </div>
        )}
        {nonprofit && (
          <div className="flex flex-col gap-1">
            <p className="eyebrow">Option to save: nonprofit licenses</p>
            <p className="font-mono text-3xl font-semibold">
              {formatCurrency(nonprofit.annualSavings, currency)}
              <span className="text-base font-normal text-muted-foreground"> a year</span>
            </p>
            <p className="text-muted-foreground">
              You told us you&apos;re a nonprofit or school. Salesforce&apos;s Power of Us program donates {POWER_OF_US_LICENSES} Enterprise
              licenses to eligible organizations, and sells more at a nonprofit discount. That&apos;s {formatNumber(nonprofit.licenses)}{" "}
              {nonprofit.licenses === 1 ? "license" : "licenses"} you&apos;d stop paying for, at your seat price. Apply on Salesforce&apos;s
              Power of Us page before {day(contract.noticeBy)}. Not added to your savings total until you&apos;re accepted.
            </p>
          </div>
        )}
        {clouds.aws && (
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
              {day(contract.noticeBy)}.{" "}
              {clouds.aws.apps.length > 0 && (
                <>
                  <EligibleAppsList option={clouds.aws} currency={currency} /> Buying {clouds.aws.apps.length === 1 ? "it" : "them"} through AWS
                  Marketplace counts too{awsSaving !== null ? ", and is included above" : ""}.{" "}
                </>
              )}
              Not added to your savings total.{" "}
              <Link href="/settings#expert-review" className="text-foreground underline underline-offset-2 hover:text-cobalt">
                Questions? Book an expert review.
              </Link>
            </p>
          </div>
        )}
        {resellerApps.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="eyebrow">Option to save: reseller quotes on AWS Marketplace</p>
            <p className="font-semibold">
              {formatNumber(resellerApps.length)} {resellerApps.length === 1 ? "app" : "apps"} you use{" "}
              {resellerApps.length === 1 ? "is" : "are"} sold on AWS Marketplace
            </p>
            <p className="text-muted-foreground">
              {resellerApps.map((a, i) => (
                <span key={a.status.source}>
                  {i > 0 && ", "}
                  <a href={a.status.source} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2 hover:text-cobalt">
                    {a.name}
                  </a>
                  {a.annualCost !== null && ` (${formatCurrency(a.annualCost, currency)} a year)`}
                </span>
              ))}
              . Before renewing with the vendor, ask an authorized AWS Marketplace reseller to quote the same product through a channel
              partner private offer. A reseller can sometimes get a vendor discount and pass part of it on. Discounts aren&apos;t guaranteed:
              the vendor must agree to the offer, and you need an AWS account to accept it and pay on your AWS bill. No AWS spend
              commitment is needed. We don&apos;t estimate the saving because it&apos;s negotiated each time. Not added to your savings total.
            </p>
          </div>
        )}
        {(["google", "azure"] as const).map((c) => {
          const o = clouds[c];
          return o && <OtherCloudOption key={c} option={o} currency={currency} pricesHref={pricesHref} answersHref={answersHref} />;
        })}
      </CardContent>
    </Card>
  );
}

function EligibleAppsList({ option, currency }: { option: CloudOption; currency: string }) {
  return (
    <>
      {option.apps.length === 1 ? "One app you pay for is sold there in a way that counts: " : "Apps you pay for that are sold there in a way that counts: "}
      {option.apps.map((a, i) => (
        <span key={a.name}>
          {i > 0 && ", "}
          <a href={a.status.source} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2 hover:text-cobalt">
            {a.name}
          </a>{" "}
          ({formatCurrency(a.annualCost, currency)} a year)
        </span>
      ))}
      .
    </>
  );
}

/** Google Cloud and Azure: Salesforce itself isn't sold there, but some apps count toward the commitment. */
function OtherCloudOption({
  option,
  currency,
  pricesHref,
  answersHref,
}: {
  option: CloudOption;
  currency: string;
  pricesHref: string;
  answersHref: string;
}) {
  const label = CLOUD_LABEL[option.cloud];
  const marketplace = option.cloud === "azure" ? "Azure Marketplace" : "Google Cloud Marketplace";
  return (
    <div className="flex flex-col gap-1">
      <p className="eyebrow">Option to save: pay apps through {label}</p>
      {option.apps.length === 0 ? (
        <p className="font-semibold">No priced app found that counts</p>
      ) : option.saving !== null ? (
        <p className="font-mono text-3xl font-semibold">
          {formatCurrency(option.saving, currency)}
          <span className="text-base font-normal text-muted-foreground"> a year</span>
        </p>
      ) : (
        <p className="font-semibold">
          <Link href={answersHref} className="text-cobalt hover:underline">
            Add your {label} numbers to see the saving
          </Link>
        </p>
      )}
      <p className="text-muted-foreground">
        You told us your company has a {label} spend commitment. Salesforce itself isn&apos;t sold on {marketplace} yet
        {option.cloud === "google" ? " (Salesforce has said it plans to)" : ""}, but some apps that work with it are, and buying them there
        counts toward that commitment
        {option.cloud === "azure" ? " when the listing is marked \"Azure benefit eligible\"" : " when the product runs on Google Cloud"}.{" "}
        {option.apps.length > 0 ? (
          <>
            <EligibleAppsList option={option} currency={currency} /> The saving is the smaller of what you pay for{" "}
            {option.apps.length === 1 ? "it" : "them"} and the commitment you expect to leave unused.{" "}
          </>
        ) : (
          <>
            None of the apps you&apos;ve priced is on our checked list for {marketplace} yet.{" "}
            <Link href={pricesHref} className="text-foreground underline underline-offset-2 hover:text-cobalt">
              Price your apps
            </Link>{" "}
            so we can check them, or ask each vendor whether they sell through {marketplace}.{" "}
          </>
        )}
        Not added to your savings total.{" "}
        <Link href="/settings#expert-review" className="text-foreground underline underline-offset-2 hover:text-cobalt">
          Questions? Book an expert review.
        </Link>
      </p>
    </div>
  );
}

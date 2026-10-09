import { AlertTriangle, Download, Printer, Settings2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton, UpgradeCard } from "@/components/app/upgrade-card";
import { MetricsChart } from "@/components/report/metrics-chart";
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
import type { Category, Recommendation } from "@/lib/savings/engine";
import { latestScan, scanHistory } from "@/lib/scan";
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
};

const appStatusVariant = { idle: "danger", unknown: "muted", active: "default" } as const;
const appStatusLabel = { idle: "Unused", unknown: "Can't tell", active: "In use" } as const;

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
    latestScan(connection.id),
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
  const appReview = reviewApps(snapshot);
  // Results from before engine v3 have no app prices; fall back to the unpriced review.
  const connectedApps = result.connectedApps ?? appReview.tools.map((t) => ({ ...t, monthlyPrice: null, annualSavings: 0 }));
  const connectedSavings = connectedApps.reduce((a, t) => a + t.annualSavings, 0);
  const installedSavings = (result.apps ?? []).reduce((a, t) => a + (t.annualSavings ?? 0), 0);
  // Read from the live review so results saved before this flag existed get it too.
  const salesforceApps = new Set(appReview.tools.filter((t) => t.salesforce).map((t) => t.appName));
  const appPricesHref = `/orgs/${connection.id}/prices#apps`;
  const history = access.monitoring ? await scanHistory(connection.id) : [];
  const categories = (Object.entries(result.byCategory) as [Category, number][]).filter(([, v]) => v > 0);
  const actionable = result.recommendations.filter((r) => !r.advisory);
  const advisory = result.recommendations.filter((r) => r.advisory);

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
            <p className="mt-4 text-5xl font-bold tracking-[-0.06em] text-lime print:text-positive">{formatCurrency(result.annualSavings)}</p>
            <p className="text-sm text-[#96958d]">{formatCurrency(result.monthlySavings)} per month</p>
          </CardHeader>
          <CardContent className="flex flex-col text-sm">
            {categories.map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-[#2d2d29] py-3 first:border-t">
                <span className="text-[#b5b3aa]">{CATEGORY_LABEL[key]}</span>
                <span className="font-mono font-semibold">{formatCurrency(value)}</span>
              </div>
            ))}
            <p className="mt-4 text-xs text-[#96958d]">
              Based on {result.prices.source === "edition_default" ? `list prices for ${connection.edition}` : "your prices"}: $
              {result.prices.fullMonthly}/user/month full, ${result.prices.platformMonthly} Platform.{" "}
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
            {actionable.length === 0 && <p className="text-sm text-muted-foreground">No license waste found. Your org is in good shape.</p>}
            {[...actionable, ...advisory].map((r) => (
              <RecommendationRow key={r.id} rec={r} />
            ))}
          </CardContent>
        </Card>
      </div>

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

          <Card>
            <CardHeader>
              <CardTitle>Users to act on</CardTitle>
              <CardDescription>Names open the user record in Salesforce.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTabs
                instanceUrl={connection.instanceUrl}
                tabs={[
                  { key: "inactive", label: "Inactive", users: result.users.inactive },
                  { key: "integration", label: "Integration", users: result.users.integration },
                  { key: "platform", label: "Platform candidates", users: result.users.platform },
                  { key: "viewOnly", label: "View-only", users: result.users.viewOnly ?? [] },
                ]}
              />
            </CardContent>
          </Card>

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
                  <span className="font-mono text-lg font-semibold text-cobalt">{formatCurrency(connectedSavings)}</span> a year from
                  cancelling unused apps and consolidating overlapping ones.
                </p>
              )}
              <p className="text-sm">{appReview.summary}</p>
              {connectedApps.length > 0 && (
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
                    {connectedApps.map((t) => (
                      <TR key={t.appName}>
                        <TD className="font-medium">{t.appName}</TD>
                        <TD className="text-right whitespace-nowrap">
                          <AppSaving saving={t.annualSavings} priced={t.monthlyPrice !== null} flagged={!salesforceApps.has(t.appName) && (t.verdict === "remove" || t.verdict === "consolidate")} href={appPricesHref} />
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
              )}
            </CardContent>
          </Card>

          {result.apps && result.apps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Installed apps</CardTitle>
                <CardDescription>
                  AppExchange packages and the last time anyone created or edited a record in their objects. Apps idle for 90+ days are
                  worth cancelling at renewal.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {installedSavings > 0 && (
                  <p className="text-sm">
                    <span className="font-mono text-lg font-semibold text-cobalt">{formatCurrency(installedSavings)}</span> a year from
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
                      <TH>Status</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {result.apps.map((a) => (
                      <TR key={a.namespace ?? a.name}>
                        <TD>
                          <span className="font-medium">{a.name}</span>
                          {a.namespace && <div className="font-mono text-xs text-muted-foreground">{a.namespace}</div>}
                        </TD>
                        <TD className="text-right whitespace-nowrap">
                          <AppSaving
                            saving={a.annualSavings ?? 0}
                            priced={a.monthlyPrice != null}
                            flagged={a.status === "idle"}
                            href={a.namespace ? appPricesHref : null}
                          />
                          {a.status === "idle" && a.namespace && a.monthlyPrice == null && (
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
                        <TD className="whitespace-nowrap">{a.lastActivity ? formatDate(a.lastActivity) : a.status === "idle" ? "No records" : "—"}</TD>
                        <TD>
                          <Badge variant={appStatusVariant[a.status]}>{appStatusLabel[a.status]}</Badge>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Licenses</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <THead>
                    <tr>
                      <TH>License</TH>
                      <TH className="text-right">Used</TH>
                      <TH className="text-right">Total</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {result.licenses
                      .filter((l) => l.kind === "user" && l.total !== 0)
                      .map((l) => (
                        <TR key={l.name}>
                          <TD>
                            {l.name}
                            {l.utilization !== null && (
                              <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                                <div className="h-1.5 rounded-full bg-cobalt" style={{ width: `${Math.min(100, l.utilization * 100)}%` }} />
                              </div>
                            )}
                          </TD>
                          <TD className="text-right">{formatNumber(l.used)}</TD>
                          <TD className="text-right">{l.total < 0 ? "Unlimited" : formatNumber(l.total)}</TD>
                        </TR>
                      ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage and sandboxes</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm">
                {result.storage ? (
                  <>
                    <Meter label="Data storage" value={result.storage.dataUsedPct} />
                    <Meter label="File storage" value={result.storage.fileUsedPct} />
                  </>
                ) : (
                  <p className="text-muted-foreground">Storage limits weren&apos;t readable.</p>
                )}
                {result.sandboxes ? (
                  <p>
                    {result.sandboxes.total} sandboxes: {result.sandboxes.full} Full Copy, {result.sandboxes.partial} Partial Copy,{" "}
                    {result.sandboxes.developer} Developer.
                  </p>
                ) : (
                  <p className="text-muted-foreground">Sandbox details weren&apos;t readable.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales activity, last 6 months</CardTitle>
              <CardDescription>Useful context when deciding who really needs a full license.</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricsChart metrics={snapshot.metrics} />
            </CardContent>
          </Card>
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
                    <TD className="text-right">{formatCurrency(h.annualSavings ?? 0)}</TD>
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
            <CardTitle className="text-sm">Scan notes</CardTitle>
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

function RecommendationRow({ rec }: { rec: Recommendation }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <p className="font-medium">
          {rec.title} <Badge variant={confidenceVariant[rec.confidence]}>{rec.confidence} confidence</Badge>
        </p>
        <p className="text-sm text-muted-foreground">{rec.detail}</p>
      </div>
      <p className="shrink-0 text-right font-mono font-semibold">{rec.advisory ? <span className="text-xs font-normal text-muted-foreground">Advice</span> : formatCurrency(rec.annualSavings)}</p>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between">
        <span>{label}</span>
        <span className={pct > 75 ? "font-medium text-warning" : ""}>{pct}% used</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-muted">
        <div className={`h-2 rounded-full ${pct > 90 ? "bg-danger" : pct > 75 ? "bg-coral" : "bg-cobalt"}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

/** Dollar saving for an app row; flagged apps without a price link to where the price is entered. */
function AppSaving({ saving, priced, flagged, href }: { saving: number; priced: boolean; flagged: boolean; href: string | null }) {
  if (saving > 0) return <span className="font-mono font-semibold text-cobalt">{formatCurrency(saving)}</span>;
  if (flagged && !priced && href)
    return (
      <Link href={href} className="text-xs font-semibold text-cobalt underline-offset-4 hover:underline">
        Add price
      </Link>
    );
  return <span className="text-muted-foreground">—</span>;
}

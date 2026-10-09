import type { Metadata } from "next";
import Link from "next/link";
import { AppPriceForm, type AppPriceRow } from "@/components/report/app-price-form";
import { PriceForm } from "@/components/report/price-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { appExchangeSearchUrl } from "@/lib/apps/appexchange";
import { reviewApps } from "@/lib/apps/review";
import { requireConnection } from "@/lib/auth";
import { env } from "@/lib/env";
import { defaultPriceBook } from "@/lib/savings/prices";
import { getPriceBook, latestScan } from "@/lib/scan";
import { formatNumber } from "@/lib/utils";
import { resetPricesAction } from "../actions";

export const metadata: Metadata = { title: "Prices" };

export default async function PricesPage({ params }: PageProps<"/orgs/[connectionId]/prices">) {
  const { connectionId } = await params;
  const { connection } = await requireConnection(connectionId);
  const [prices, scan] = await Promise.all([getPriceBook(connection), latestScan(connection.id, { succeededOnly: true })]);
  const defaults = defaultPriceBook(connection.edition);

  // Apps found in the latest scan. Packages are priced by namespace, so ones without a namespace can't be priced.
  const packageRows: AppPriceRow[] = [];
  const connectedRows: AppPriceRow[] = [];
  if (scan?.snapshot && scan.result) {
    const seen = new Set<string>();
    for (const a of scan.result.apps ?? []) {
      if (!a.namespace) continue;
      seen.add(a.namespace);
      const perSeat = a.seats !== null && a.seats.allowed > 0;
      packageRows.push({
        field: `package:${a.namespace}`,
        name: a.name,
        detail: a.seats ? (a.seats.allowed < 0 ? "Site license" : `${formatNumber(a.seats.used)} of ${formatNumber(a.seats.allowed)} seats used`) : "No seat count",
        unit: perSeat ? "per seat / mo" : "per month",
        value: prices.apps?.packages[a.namespace] ?? null,
        lookupUrl: appExchangeSearchUrl(a.name),
      });
    }
    for (const l of scan.snapshot.packageLicenses) {
      if (seen.has(l.namespace) || l.allowed <= 0) continue;
      packageRows.push({
        field: `package:${l.namespace}`,
        name: l.namespace,
        detail: `${formatNumber(l.used)} of ${formatNumber(l.allowed)} seats used`,
        unit: "per seat / mo",
        value: prices.apps?.packages[l.namespace] ?? null,
      });
    }
    // Salesforce's own apps come with the org, so there's nothing to price.
    for (const t of reviewApps(scan.snapshot).tools) {
      if (t.salesforce) continue;
      connectedRows.push({
        field: `connected:${t.appName}`,
        name: t.appName,
        detail: `${t.category} · ${formatNumber(t.users)} ${t.users === 1 ? "user" : "users"}`,
        unit: "per month",
        value: prices.apps?.connectedApps[t.appName] ?? null,
      });
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link href={`/orgs/${connection.id}`} className="eyebrow hover:text-cobalt">
          {connection.orgName}
        </Link>
        <h1 className="display-title mt-4 mb-3">Your Salesforce prices</h1>
        <p className="text-muted-foreground">
          Savings use list prices until you enter what you actually pay. Discounts are common, so your real numbers make the report
          credible with finance.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Prices</CardTitle>
          <CardDescription>
            {prices.source === "edition_default"
              ? `Currently using ${connection.edition} list prices.`
              : `Using ${prices.source === "contract" ? "prices from your contract" : "your prices"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PriceForm connectionId={connection.id} prices={prices} aiEnabled={Boolean(env().ANTHROPIC_API_KEY)} />
        </CardContent>
      </Card>
      {prices.source !== "edition_default" && (
        <form action={resetPricesAction.bind(null, connection.id)}>
          <Button type="submit" variant="link" className="px-0">
            Reset to list prices (${defaults.fullMonthly} full, ${defaults.platformMonthly} Platform)
          </Button>
        </form>
      )}
      {(packageRows.length > 0 || connectedRows.length > 0) && (
        <Card id="apps">
          <CardHeader>
            <CardTitle>App prices</CardTitle>
            <CardDescription>
              Salesforce doesn&apos;t know what you pay other vendors. Add a price for any app you pay for and unused or overlapping apps
              show a dollar saving in the report. Leave free apps blank. For installed apps, the AppExchange link shows the vendor&apos;s
              list price if you don&apos;t have your contract to hand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppPriceForm
              connectionId={connection.id}
              groups={[
                { title: "Installed apps", rows: packageRows },
                { title: "Connected apps", rows: connectedRows },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

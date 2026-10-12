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
import { AWS_MARKETPLACE_CAP, summarizeContract } from "@/lib/savings/contract";
import { defaultPriceBook } from "@/lib/savings/prices";
import { getPriceBook, latestScan } from "@/lib/scan";
import { currencySymbol, formatNumber } from "@/lib/utils";
import { resetPricesAction } from "../actions";

export const metadata: Metadata = { title: "Prices" };

export default async function PricesPage({ params }: PageProps<"/orgs/[connectionId]/prices">) {
  const { connectionId } = await params;
  const { connection } = await requireConnection(connectionId);
  const [prices, scan] = await Promise.all([getPriceBook(connection), latestScan(connection.id, { succeededOnly: true })]);
  const defaults = defaultPriceBook(connection.edition);
  // What the latest scan priced with: invoice-based prices and the contract's currency when there are invoices.
  const effective = scan?.result?.prices;
  const currency = effective?.currency ?? "USD";
  const symbol = currencySymbol(currency);
  const fromInvoices = prices.source === "edition_default" && effective?.source === "invoices";

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
        lookupUrl: a.listPrice && currency === "USD" ? undefined : appExchangeSearchUrl(a.name),
        hint: a.listPrice && currency === "USD"
          ? `List price $${a.listPrice.price} ${a.listPrice.unit === "user" ? "per user" : "for the org"} a month (${a.listPrice.tier}, checked ${a.listPrice.checked}), used until you enter yours`
          : undefined,
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

  // Salesforce add-ons the scan found, which Salesforce doesn't publish one clear price for.
  const addOnRows: AppPriceRow[] = [];
  const addOns = prices.apps?.addOns;
  const partialSandboxes = scan?.result?.sandboxes?.partial ?? 0;
  if (partialSandboxes > 0 || addOns?.partialSandboxMonthly !== undefined) {
    addOnRows.push({
      field: "addon:partialSandboxMonthly",
      name: "Partial Copy sandbox",
      detail: `${formatNumber(partialSandboxes)} in this org`,
      unit: "per sandbox / mo",
      value: addOns?.partialSandboxMonthly ?? null,
    });
  }
  const serviceCloudUsers = scan?.snapshot?.serviceCloudUserIds?.length ?? 0;
  if (serviceCloudUsers > 0 || addOns?.serviceCloudUserMonthly !== undefined) {
    addOnRows.push({
      field: "addon:serviceCloudUserMonthly",
      name: "Service Cloud User feature license",
      detail: `${formatNumber(serviceCloudUsers)} ${serviceCloudUsers === 1 ? "user has" : "users have"} it. Leave blank if it comes with your main license.`,
      unit: "per user / mo",
      value: addOns?.serviceCloudUserMonthly ?? null,
    });
  }

  // Optional AWS numbers for the "pay through AWS" option on the contract card, which needs the Salesforce bill.
  const contract = summarizeContract(scan?.snapshot?.salesforceAccount, scan?.startedAt);
  const awsRows: AppPriceRow[] = [];
  if (contract?.annualSpend || addOns?.awsCommitmentYearly !== undefined || addOns?.awsUnusedYearly !== undefined) {
    awsRows.push(
      {
        field: "addon:awsCommitmentYearly",
        name: "AWS spend commitment",
        detail: `Only if your company has an AWS EDP or PPA. AWS usually counts Marketplace purchases up to ${AWS_MARKETPLACE_CAP * 100}% of it.`,
        unit: "per year",
        value: addOns?.awsCommitmentYearly ?? null,
      },
      {
        field: "addon:awsUnusedYearly",
        name: "AWS commitment you expect to leave unused",
        detail: "Your AWS account team or finance can tell you. Enter 0 if you'll use it all.",
        unit: "this year",
        value: addOns?.awsUnusedYearly ?? null,
      },
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link href={`/orgs/${connection.id}`} className="eyebrow hover:text-cobalt">
          {connection.orgName}
        </Link>
        <h1 className="display-title mt-4 mb-3">Your Salesforce prices</h1>
        <p className="text-muted-foreground">
          Savings use what your Salesforce invoices say you pay, or list prices when we can&apos;t read your invoices, until you enter
          your own prices. Your exact numbers make the report credible with finance.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Prices</CardTitle>
          <CardDescription>
            {fromInvoices
              ? `Currently using prices worked out from your Salesforce invoices: ${symbol}${effective!.fullMonthly} per full license and ${symbol}${effective!.platformMonthly} per Platform license a month, in ${currency}. That's your yearly bill spread across your user licenses, so it includes any add-ons. Enter your contract prices for exact figures.`
              : prices.source === "edition_default"
                ? `Currently using ${connection.edition} list prices in USD. Connect as a user with the Manage Billing permission and rescan to use your invoices instead.`
                : `Using ${prices.source === "contract" ? "prices from your contract" : "your prices"}, in ${currency}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PriceForm
            connectionId={connection.id}
            prices={fromInvoices ? effective! : prices}
            aiEnabled={Boolean(env().ANTHROPIC_API_KEY)}
            symbol={symbol}
          />
        </CardContent>
      </Card>
      {prices.source !== "edition_default" && (
        <form action={resetPricesAction.bind(null, connection.id)}>
          <Button type="submit" variant="link" className="px-0">
            {contract?.annualSpend
              ? "Clear my prices and go back to prices from your invoices"
              : `Reset to list prices ($${defaults.fullMonthly} full, $${defaults.platformMonthly} Platform)`}
          </Button>
        </form>
      )}
      {(packageRows.length > 0 || connectedRows.length > 0 || addOnRows.length > 0 || awsRows.length > 0) && (
        <Card id="apps">
          <CardHeader>
            <CardTitle>App and add-on prices</CardTitle>
            <CardDescription>
              Salesforce doesn&apos;t know what you pay other vendors. Add a price for any app you pay for and unused or overlapping apps
              show a dollar saving in the report. Leave free apps blank. For installed apps, the AppExchange link shows the vendor&apos;s
              list price if you don&apos;t have your contract to hand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppPriceForm
              connectionId={connection.id}
              symbol={symbol}
              groups={[
                { title: "Salesforce add-ons", rows: addOnRows },
                { title: "Installed apps", rows: packageRows },
                { title: "Connected apps", rows: connectedRows },
                { title: "AWS commitment (optional)", rows: awsRows },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

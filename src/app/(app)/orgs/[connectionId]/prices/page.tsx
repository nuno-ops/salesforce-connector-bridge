import type { Metadata } from "next";
import Link from "next/link";
import { PriceForm } from "@/components/report/price-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireConnection } from "@/lib/auth";
import { env } from "@/lib/env";
import { defaultPriceBook } from "@/lib/savings/prices";
import { getPriceBook } from "@/lib/scan";
import { resetPricesAction } from "../actions";

export const metadata: Metadata = { title: "Prices" };

export default async function PricesPage({ params }: PageProps<"/orgs/[connectionId]/prices">) {
  const { connectionId } = await params;
  const { connection } = await requireConnection(connectionId);
  const prices = await getPriceBook(connection);
  const defaults = defaultPriceBook(connection.edition);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link href={`/orgs/${connection.id}`} className="text-sm text-muted-foreground hover:underline">
          ← {connection.orgName}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Your Salesforce prices</h1>
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
    </div>
  );
}

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function CheckoutButton({
  product,
  returnPath,
  connectionId,
  children,
  variant = "default",
}: {
  product: "monitor" | "audit" | "consult";
  returnPath: string;
  connectionId?: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "accent";
}) {
  return (
    <form action="/api/stripe/checkout" method="post">
      <input type="hidden" name="product" value={product} />
      <input type="hidden" name="returnPath" value={returnPath} />
      {connectionId && <input type="hidden" name="connectionId" value={connectionId} />}
      <Button type="submit" variant={variant}>
        {children}
      </Button>
    </form>
  );
}

/** The locked report's call to action: what's behind the lock and the one-off price for this org's size. */
export function UpgradeCard({
  returnPath,
  connectionId,
  price,
  sizeLabel,
  access,
  locked,
}: {
  returnPath: string;
  connectionId: string;
  price: number;
  /** e.g. "51 to 250 users" */
  sizeLabel: string;
  /** e.g. "90 days" */
  access: string;
  /** What the unlock reveals, e.g. ["14 users to act on", "3 apps to cancel"]. */
  locked: string[];
}) {
  return (
    <Card className="border-cobalt">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-4" /> See exactly where the savings are
        </CardTitle>
        <CardDescription>
          The full report names every user and app behind these numbers with links into Salesforce, explains each saving, lists your
          renewal buying options, and exports to CSV and a printable report for finance.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {locked.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-sm">
            {locked.map((l) => (
              <li key={l} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1">
                <Lock className="size-3 text-muted-foreground" /> {l}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <CheckoutButton product="audit" returnPath={returnPath} connectionId={connectionId} variant="accent">
            Unlock the full report · {formatCurrency(price, "USD")} one-off
          </CheckoutButton>
          <p className="text-xs text-muted-foreground">
            Price for orgs with {sizeLabel}. {access} of access, rescans included. No subscription. If we find less than the price in
            savings, the full report is free.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

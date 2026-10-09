import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CheckoutButton({
  product,
  returnPath,
  children,
  variant = "default",
}: {
  product: "monitor" | "audit" | "consult";
  returnPath: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "accent";
}) {
  return (
    <form action="/api/stripe/checkout" method="post">
      <input type="hidden" name="product" value={product} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <Button type="submit" variant={variant}>
        {children}
      </Button>
    </form>
  );
}

export function UpgradeCard({ returnPath, auditHours }: { returnPath: string; auditHours: number }) {
  return (
    <Card className="border-cobalt">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-4" /> Unlock the full report
        </CardTitle>
        <CardDescription>
          See every user behind these numbers with direct links into Salesforce, export to CSV, print a report for finance, and see
          which connected apps are unused or overlapping.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <CheckoutButton product="monitor" returnPath={returnPath} variant="accent">
          Monitor savings · $39/month
        </CheckoutButton>
        <CheckoutButton product="audit" returnPath={returnPath} variant="outline">
          One-off audit · $99 ({auditHours < 72 ? `${auditHours} hours` : `${Math.round(auditHours / 24)} days`} access)
        </CheckoutButton>
      </CardContent>
    </Card>
  );
}

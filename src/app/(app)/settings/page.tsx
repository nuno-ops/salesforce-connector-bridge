import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/app/upgrade-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireWorkspace } from "@/lib/auth";
import { getAccess } from "@/lib/billing/server";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

const PLAN_LABEL = { free: "Free", audit: "One-off audit", monitor: "Savings Monitor" } as const;

export default async function SettingsPage() {
  const { user, workspace } = await requireWorkspace();
  const [access, [entitlement], connections] = await Promise.all([
    getAccess(workspace.id),
    db().select().from(schema.entitlements).where(eq(schema.entitlements.workspaceId, workspace.id)).limit(1),
    db().select().from(schema.sfConnections).where(eq(schema.sfConnections.workspaceId, workspace.id)),
  ]);
  const e = env();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-foreground pb-8">
        <p className="eyebrow">Account</p>
        <h1 className="display-title">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
      </Card>

      {access.billingEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Plan <Badge>{PLAN_LABEL[access.plan]}</Badge>
            </CardTitle>
            <CardDescription>
              {access.plan === "monitor" && entitlement?.currentPeriodEnd && `Renews ${formatDate(entitlement.currentPeriodEnd)}.`}
              {access.plan === "audit" && access.auditAccessUntil && `Full report unlocked until ${access.auditAccessUntil.toLocaleString("en-US")}.`}
              {access.plan === "free" && "You can see total savings and recommendations. Upgrade for user-level detail and exports."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {access.plan !== "monitor" && (
              <CheckoutButton product="monitor" returnPath="/settings">
                Start monitoring · $39/month
              </CheckoutButton>
            )}
            {access.plan === "free" && (
              <CheckoutButton product="audit" returnPath="/settings" variant="outline">
                One-off audit · $99
              </CheckoutButton>
            )}
            {entitlement?.stripeCustomerId && (
              <form action="/api/stripe/portal" method="post">
                <Button variant="outline" type="submit">
                  Manage billing
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expert review</CardTitle>
          <CardDescription>Walk through your report with a Salesforce licensing specialist before your renewal.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {access.billingEnabled && e.STRIPE_PRICE_CONSULT ? (
            <CheckoutButton product="consult" returnPath="/settings?booked=1">
              Book a paid consultation
            </CheckoutButton>
          ) : (
            <Button asChild variant="outline">
              <a href={e.CALENDLY_URL} target="_blank" rel="noreferrer">
                Book a call
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected orgs</CardTitle>
          <CardDescription>We hold encrypted, read-only tokens. Disconnecting revokes them in Salesforce.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {connections.length === 0 && <p className="text-sm text-muted-foreground">No orgs connected.</p>}
          {connections.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <Link href={`/orgs/${c.id}`} className="font-medium hover:underline">
                  {c.orgName}
                </Link>
                <p className="text-muted-foreground">
                  {c.sfUsername} · {c.instanceUrl.replace("https://", "")}
                </p>
              </div>
              <Badge variant={c.status === "active" ? "default" : "warning"}>{c.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { ExpertCallCard } from "@/components/app/expert-call";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireWorkspace } from "@/lib/auth";
import { getAccess } from "@/lib/billing/server";
import { db, schema } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { relockPreviewAction } from "./actions";

export const metadata: Metadata = { title: "Settings" };

const PLAN_LABEL = { free: "Free", audit: "Full report", monitor: "Savings Monitor" } as const;

export default async function SettingsPage() {
  const { user, workspace } = await requireWorkspace();
  const [access, [entitlement], connections] = await Promise.all([
    getAccess(workspace.id),
    db().select().from(schema.entitlements).where(eq(schema.entitlements.workspaceId, workspace.id)).limit(1),
    db().select().from(schema.sfConnections).where(eq(schema.sfConnections.workspaceId, workspace.id)),
  ]);

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
              {access.preview && <Badge variant="warning">Preview</Badge>}
            </CardTitle>
            <CardDescription>
              {access.plan === "monitor" && entitlement?.currentPeriodEnd && `Renews ${formatDate(entitlement.currentPeriodEnd)}.`}
              {access.plan === "audit" && access.auditAccessUntil && `Full report unlocked until ${formatDate(access.auditAccessUntil)}, rescans included.`}
              {access.plan === "free" &&
                "Scans are free and show your total savings. Unlock the full report from an org's report page: a one-off payment priced by the org's size."}
            </CardDescription>
          </CardHeader>
          {access.preview && (
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Billing preview: this account sees the paywall that customers will see, and unlocking is free. Customers aren&apos;t
                affected.
              </p>
              {access.plan === "audit" && (
                <form action={relockPreviewAction}>
                  <Button variant="outline" type="submit">
                    Lock the report again
                  </Button>
                </form>
              )}
            </CardContent>
          )}
          {entitlement?.stripeCustomerId && (
            <CardContent className="flex flex-wrap gap-3">
              <form action="/api/stripe/portal" method="post">
                <Button variant="outline" type="submit">
                  Billing history
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      <Card id="company" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Your company</CardTitle>
          <CardDescription>
            {workspace.answers && !workspace.answers.skipped
              ? `Answered ${formatDate(workspace.answers.answeredAt)}. Nonprofit status, Premier Success, cloud commitments and Agentforce plans change what you could save.`
              : "Not answered yet. Whether you're a nonprofit, pay for Premier Success, have a cloud commitment or plan to buy Agentforce changes what you could save."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/welcome?next=/settings">{workspace.answers && !workspace.answers.skipped ? "Change answers" : "Answer a few questions"}</Link>
          </Button>
        </CardContent>
      </Card>

      <ExpertCallCard
        id="expert-review"
        returnPath="/settings"
        description="Walk through your report with a Salesforce specialist before your renewal, and get help with the clean-up, the renewal negotiation, or any other Salesforce work."
      />

      <Card>
        <CardHeader>
          <CardTitle>Connected orgs</CardTitle>
          <CardDescription>We hold encrypted tokens and only use them to read. Disconnecting revokes them in Salesforce.</CardDescription>
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

import { desc, eq, sql } from "drizzle-orm";
import { AlertTriangle, Building2, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ConnectForm } from "@/components/app/connect-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireWorkspace } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Your orgs" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { workspace } = await requireWorkspace();
  const { error } = await searchParams;

  const latest = db()
    .selectDistinctOn([schema.scans.connectionId], {
      connectionId: schema.scans.connectionId,
      annualSavings: schema.scans.annualSavings,
      startedAt: schema.scans.startedAt,
    })
    .from(schema.scans)
    .where(eq(schema.scans.status, "succeeded"))
    .orderBy(schema.scans.connectionId, desc(schema.scans.startedAt))
    .as("latest");

  const connections = await db()
    .select({
      id: schema.sfConnections.id,
      orgName: schema.sfConnections.orgName,
      edition: schema.sfConnections.edition,
      isSandbox: schema.sfConnections.isSandbox,
      status: schema.sfConnections.status,
      instanceUrl: schema.sfConnections.instanceUrl,
      annualSavings: latest.annualSavings,
      lastScan: latest.startedAt,
    })
    .from(schema.sfConnections)
    .leftJoin(latest, eq(latest.connectionId, schema.sfConnections.id))
    .where(eq(schema.sfConnections.workspaceId, workspace.id))
    .orderBy(sql`${schema.sfConnections.createdAt} desc`);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Your Salesforce orgs</h1>
        <p className="text-muted-foreground">Connect an org to see where you&apos;re overpaying for licenses.</p>
      </div>

      {typeof error === "string" && (
        <p className="flex items-center gap-2 rounded-md bg-danger-bg p-3 text-sm text-danger">
          <AlertTriangle className="size-4" /> {error}
        </p>
      )}

      {connections.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {connections.map((c) => (
            <Link key={c.id} href={`/orgs/${c.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="size-5 text-muted-foreground" />
                    <div>
                      <CardTitle>{c.orgName}</CardTitle>
                      <CardDescription>
                        {c.edition}
                        {c.isSandbox ? " · Sandbox" : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-semibold text-primary">
                      {c.annualSavings !== null ? formatCurrency(c.annualSavings) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.lastScan ? `potential yearly savings · scanned ${formatDate(c.lastScan)}` : "Not scanned yet"}
                    </p>
                  </div>
                  {c.status !== "active" && <Badge variant="warning">Reconnect needed</Badge>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{connections.length ? "Connect another org" : "Connect your first org"}</CardTitle>
          <CardDescription>You&apos;ll sign in to Salesforce and approve read-only access.</CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectForm />
        </CardContent>
      </Card>
    </div>
  );
}

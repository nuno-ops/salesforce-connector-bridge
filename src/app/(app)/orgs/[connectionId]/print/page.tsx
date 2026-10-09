import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/report/print-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireConnection } from "@/lib/auth";
import { getAccess } from "@/lib/billing/server";
import type { FlaggedUser } from "@/lib/savings/engine";
import { latestScan } from "@/lib/scan";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Savings report" };

export default async function PrintPage({ params }: PageProps<"/orgs/[connectionId]/print">) {
  const { connectionId } = await params;
  const { connection, workspace } = await requireConnection(connectionId);
  const [scan, access] = await Promise.all([latestScan(connection.id, { succeededOnly: true }), getAccess(workspace.id)]);
  if (!scan?.result || !access.fullReport) notFound();
  const r = scan.result;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 bg-card p-8 print:p-0">
      <header className="flex items-start justify-between">
        <div>
          <p className="eyebrow">Salesforce Saver · savings report</p>
          <h1 className="mt-3 text-3xl font-bold">License savings report: {connection.orgName}</h1>
          <p className="text-sm text-muted-foreground">
            {connection.edition} · data as of {formatDate(scan.startedAt)}
          </p>
        </div>
        <PrintButton />
      </header>

      <section>
        <p className="text-sm text-muted-foreground">Potential yearly savings</p>
        <p className="text-4xl font-bold text-positive">{formatCurrency(r.annualSavings)}</p>
        <p className="text-sm text-muted-foreground">
          Priced at ${r.prices.fullMonthly}/user/month for full licenses and ${r.prices.platformMonthly} for Platform (
          {r.prices.source === "edition_default" ? "list prices" : "customer prices"}).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Recommendations</h2>
        <Table>
          <THead>
            <tr>
              <TH>Action</TH>
              <TH>Confidence</TH>
              <TH className="text-right">Yearly savings</TH>
            </tr>
          </THead>
          <TBody>
            {r.recommendations.map((rec) => (
              <TR key={rec.id}>
                <TD>
                  <p className="font-medium">{rec.title}</p>
                  <p className="text-xs text-muted-foreground">{rec.detail}</p>
                </TD>
                <TD className="capitalize">{rec.confidence}</TD>
                <TD className="text-right">{rec.advisory ? "Advice" : formatCurrency(rec.annualSavings)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </section>

      <UserSection title="Inactive users" users={r.users.inactive} />
      <UserSection title="Integration users" users={r.users.integration} />
      <UserSection title="Platform license candidates" users={r.users.platform} />
    </article>
  );
}

function UserSection({ title, users }: { title: string; users: FlaggedUser[] }) {
  if (users.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 break-inside-avoid-page">
      <h2 className="text-lg font-semibold">
        {title} ({users.length})
      </h2>
      <Table>
        <THead>
          <tr>
            <TH>User</TH>
            <TH>Last login</TH>
            <TH>Reason</TH>
            <TH className="text-right">Yearly</TH>
          </tr>
        </THead>
        <TBody>
          {users.map((u) => (
            <TR key={u.id}>
              <TD>
                {u.name}
                <div className="text-xs text-muted-foreground">{u.username}</div>
              </TD>
              <TD>{formatDate(u.lastLoginDate)}</TD>
              <TD>{u.reason}</TD>
              <TD className="text-right">{formatCurrency(u.annualSavings)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </section>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/report/print-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireConnection } from "@/lib/auth";
import { getAccess } from "@/lib/billing/server";
import { summarizeContract } from "@/lib/savings/contract";
import { reportRecommendations, type FlaggedUser } from "@/lib/savings/engine";
import { latestScan } from "@/lib/scan";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Savings report" };

export default async function PrintPage({ params }: PageProps<"/orgs/[connectionId]/print">) {
  const { connectionId } = await params;
  const { connection, workspace } = await requireConnection(connectionId);
  const [scan, access] = await Promise.all([latestScan(connection.id, { succeededOnly: true }), getAccess(workspace.id)]);
  if (!scan?.result || !access.fullReport) notFound();
  const r = scan.result;
  const { priced, needsPrice } = reportRecommendations(r.recommendations);
  const contract = summarizeContract(scan.snapshot?.salesforceAccount, scan.startedAt);

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

      {contract && (
        <section className="flex flex-col gap-1 text-sm">
          <h2 className="text-lg font-semibold">Salesforce contract</h2>
          {contract.annualSpend && (
            <p>
              Yearly Salesforce bill: <strong>{formatCurrency(contract.annualSpend.amount, contract.annualSpend.currency)}</strong>{" "}
              <span className="text-muted-foreground">
                ({contract.annualSpend.basis === "invoices_on_contract" ? "from invoices on the current contract" : "invoices from the last 12 months"})
              </span>
            </p>
          )}
          <p>
            Renews {formatDate(`${contract.endDate}T00:00:00`)} ({contract.daysLeft} days
            {contract.autoRenew === true ? ", auto-renews" : contract.autoRenew === false ? ", doesn't auto-renew" : ""}). Notify Salesforce
            of seat cuts by <strong>{formatDate(`${contract.noticeBy}T00:00:00`)}</strong>.
          </p>
        </section>
      )}

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
            {priced.map((rec) => (
              <TR key={rec.id}>
                <TD>
                  <p className="font-medium">{rec.title}</p>
                  <p className="text-xs text-muted-foreground">{rec.detail}</p>
                </TD>
                <TD className="capitalize">{rec.confidence}</TD>
                <TD className="text-right">{formatCurrency(rec.annualSavings)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {needsPrice.length > 0 && (
          <div className="text-sm">
            <p className="font-medium">Add a price to see the saving</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {needsPrice.map((rec) => (
                <li key={rec.id}>{rec.title}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <UserSection title="Frozen users" users={r.users.frozen ?? []} />
      <UserSection title="Duplicate accounts" users={r.users.duplicate ?? []} />
      <UserSection title="Inactive users" users={r.users.inactive} />
      <UserSection title="Integration users" users={r.users.integration} />
      <UserSection title="Platform license candidates" users={r.users.platform} />
      <UserSection title="View-only users" users={r.users.viewOnly ?? []} />
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

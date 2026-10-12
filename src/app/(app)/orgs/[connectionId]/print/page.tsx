import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/report/print-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireConnection } from "@/lib/auth";
import { getAccess } from "@/lib/billing/server";
import { awsAddOns, nonprofitSaving, POWER_OF_US_LICENSES, premierSaving } from "@/lib/savings/answers";
import { awsCommitSaving, summarizeContract } from "@/lib/savings/contract";
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
  const currency = r.prices.currency ?? "USD";
  const money = (n: number) => formatCurrency(n, currency);
  const rise = contract?.priceChange && contract.priceChange.rate >= 0.01 ? contract.priceChange : null;
  const spend = contract?.annualSpend && contract.annualSpend.currency === currency ? contract.annualSpend : null;
  const answers = workspace.answers;
  const awsSaving = spend ? awsCommitSaving(spend.amount, awsAddOns(r.prices.apps?.addOns, answers)) : null;
  const premier = premierSaving(answers, connection.edition, spend?.amount ?? null);
  const nonprofit = scan.snapshot
    ? nonprofitSaving(answers, scan.snapshot, r.prices.fullMonthly, (r.apps ?? []).flatMap((a) => (a.namespace ? [a.namespace] : [])))
    : null;

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
        <p className="text-4xl font-bold text-positive">{money(r.annualSavings)}</p>
        <p className="text-sm text-muted-foreground">
          Priced at {money(r.prices.fullMonthly)}/user/month for full licenses and {money(r.prices.platformMonthly)} for Platform (
          {r.prices.source === "edition_default" ? "list prices" : r.prices.source === "invoices" ? "worked out from Salesforce invoices" : "customer prices"}).
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
          {rise && (
            <p>
              Invoices are {Math.round(rise.rate * 100)}% higher than a year earlier ({formatDate(`${rise.latest}T00:00:00`)} against{" "}
              {formatDate(`${rise.yearEarlier}T00:00:00`)}), a price rise or added seats.
              {contract.annualSpend && ` The same rise at renewal would add about ${formatCurrency(contract.annualSpend.amount * rise.rate, contract.annualSpend.currency)} a year.`}
            </p>
          )}
          {premier && (
            <p>
              Option to save: Premier Success, Salesforce&apos;s paid support plan, costs 30% of license fees and can be dropped to the free
              Standard plan or negotiated down at renewal.
              {premier.amount !== null
                ? ` That's about ${money(premier.amount)} a year${premier.estimated ? " (estimated from invoices, assuming it covers all licenses)" : ""}.`
                : " Check the order form for a Premier line."}{" "}
              Not added to the total.
            </p>
          )}
          {nonprofit && (
            <p>
              Option to save: as a nonprofit or school, Salesforce&apos;s Power of Us program donates {POWER_OF_US_LICENSES} Enterprise
              licenses to eligible organizations, about {money(nonprofit.annualSavings)} a year here. Not added to the total.
            </p>
          )}
          {spend && (awsSaving !== null || answers?.aws !== "no") && (
            <p>
              Option to save: if your company has an AWS spend commitment it expects to leave partly unused, buying the renewal through AWS
              Marketplace counts the Salesforce bill toward it (&quot;Deployed on AWS&quot; listings only, usually up to 25% of the commitment).
              {awsSaving !== null
                ? ` With the AWS numbers entered, that saves about ${money(awsSaving)} a year.`
                : " Enter the AWS commitment and expected unused amount on the Prices page to see the saving."}{" "}
              A possible approach, not added to the total.
            </p>
          )}
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
                <TD className="text-right">{money(rec.annualSavings)}</TD>
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

      <UserSection title="Frozen users" users={r.users.frozen ?? []} currency={currency} />
      <UserSection title="Duplicate accounts" users={r.users.duplicate ?? []} currency={currency} />
      <UserSection title="Inactive users" users={r.users.inactive} currency={currency} />
      <UserSection title="Integration users" users={r.users.integration} currency={currency} />
      <UserSection title="Platform license candidates" users={r.users.platform} currency={currency} />
      <UserSection title="View-only users" users={r.users.viewOnly ?? []} currency={currency} />
      <UserSection title="Paid in two orgs" users={r.users.crossOrg ?? []} currency={currency} />
      <UserSection title="Unused Service Cloud licenses" users={(r.users.serviceCloud ?? []).filter((u) => u.annualSavings > 0)} currency={currency} />
    </article>
  );
}

function UserSection({ title, users, currency }: { title: string; users: FlaggedUser[]; currency: string }) {
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
              <TD className="text-right">{formatCurrency(u.annualSavings, currency)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </section>
  );
}

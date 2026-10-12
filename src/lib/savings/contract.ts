import type { SnapshotSalesforceAccount, SnapshotSalesforceInvoice } from "@/lib/salesforce/types";

/** Salesforce's standard terms ask for notice of non-renewal at least 30 days before the term ends. */
export const NOTICE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

const PERIODS_PER_YEAR: Record<string, number> = {
  monthly: 12,
  quarterly: 4,
  "semi-annual": 2,
  semiannual: 2,
  "semi annual": 2,
  annual: 1,
  annually: 1,
  yearly: 1,
};

export interface ContractSummary {
  number: string | null;
  endDate: string;
  daysLeft: number;
  autoRenew: boolean | null;
  billingFrequency: string | null;
  /** Last day to tell Salesforce about seat cuts or non-renewal under the standard terms. */
  noticeBy: string;
  /** What the org pays Salesforce a year; `null` when there are no invoices to go on. */
  annualSpend: { amount: number; currency: string; basis: "invoices_on_contract" | "last_12_months" } | null;
}

/**
 * Reduces the Your Account data to what the report shows: the current contract's end date
 * and an estimate of the yearly Salesforce bill. `null` when there's no active contract.
 */
export function summarizeContract(account: SnapshotSalesforceAccount | null | undefined, now = new Date()): ContractSummary | null {
  if (!account) return null;
  const today = now.toISOString().slice(0, 10);
  const current = account.contracts
    .filter((c) => c.status === "Activated" && c.endDate && c.endDate >= today)
    .sort((a, b) => b.endDate!.localeCompare(a.endDate!))[0];
  if (!current) return null;
  const endDate = current.endDate!;
  const end = new Date(`${endDate}T00:00:00Z`);

  return {
    number: current.number,
    endDate,
    daysLeft: Math.ceil((end.getTime() - now.getTime()) / DAY_MS),
    autoRenew: current.autoRenew,
    billingFrequency: current.billingFrequency,
    noticeBy: new Date(end.getTime() - NOTICE_DAYS * DAY_MS).toISOString().slice(0, 10),
    annualSpend: annualSpend(account.invoices, current.id, current.billingFrequency, current.currency, now),
  };
}

function annualSpend(
  invoices: SnapshotSalesforceInvoice[],
  contractId: string,
  frequency: string | null,
  contractCurrency: string | null,
  now: Date,
): ContractSummary["annualSpend"] {
  const periods = frequency ? PERIODS_PER_YEAR[frequency.trim().toLowerCase()] : undefined;
  const onContract = invoices
    .filter((i) => i.contractId === contractId && i.date && i.total > 0)
    .sort((a, b) => b.date!.localeCompare(a.date!));
  if (periods && onContract.length > 0) {
    // The median of the latest few invoices, so a one-off add-on or proration doesn't skew it.
    const amount = median(onContract.slice(0, 3).map((i) => i.total)) * periods;
    return { amount, currency: contractCurrency ?? onContract[0].currency ?? "USD", basis: "invoices_on_contract" };
  }
  const yearAgo = new Date(now.getTime() - 365 * DAY_MS).toISOString().slice(0, 10);
  const lastYear = invoices.filter((i) => i.date && i.date > yearAgo && i.total > 0);
  if (lastYear.length === 0) return null;
  return {
    amount: lastYear.reduce((a, i) => a + i.total, 0),
    currency: contractCurrency ?? lastYear[0].currency ?? "USD",
    basis: "last_12_months",
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

import type { SnapshotSalesforceAccount, SnapshotSalesforceInvoice } from "@/lib/salesforce/types";
import type { AddOnPrices } from "./prices";

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
  /** The contract's ISO currency, when Salesforce reports one. */
  currency: string | null;
  /** Last day to tell Salesforce about seat cuts or non-renewal under the standard terms. */
  noticeBy: string;
  /** What the org pays Salesforce a year; `null` when there are no invoices to go on. */
  annualSpend: { amount: number; currency: string; basis: "invoices_on_contract" | "last_12_months" } | null;
  /** How much invoices rose against the same invoices a year earlier; `null` without a year of history. */
  priceChange: PriceChange | null;
}

export interface PriceChange {
  /** 0.07 = invoices are 7% higher than a year earlier. Negative when they fell. */
  rate: number;
  /** The latest invoice compared, and its counterpart a year before. */
  latest: string;
  yearEarlier: string;
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
    currency: current.currency,
    noticeBy: new Date(end.getTime() - NOTICE_DAYS * DAY_MS).toISOString().slice(0, 10),
    annualSpend: annualSpend(account.invoices, current.id, current.billingFrequency, current.currency, now),
    priceChange: priceChange(account.invoices),
  };
}

/** How far either side of "one year earlier" an invoice may fall and still count as its counterpart. */
const YEAR_MATCH_DAYS = 45;

/**
 * Compares the latest few invoices with the invoices from a year before, whatever contract they
 * were on: renewals usually start a new contract. The median ratio keeps a one-off from skewing it.
 * It can't tell a price rise from seats added in between, so callers should say so.
 */
export function priceChange(invoices: SnapshotSalesforceInvoice[]): PriceChange | null {
  const dated = invoices
    .filter((i) => i.date && i.total > 0)
    .map((i) => ({ ...i, time: new Date(`${i.date}T00:00:00Z`).getTime() }))
    .sort((a, b) => b.time - a.time);
  const pairs: { ratio: number; latest: string; yearEarlier: string }[] = [];
  for (const recent of dated.slice(0, 3)) {
    const target = recent.time - 365 * DAY_MS;
    const match = dated
      .filter((i) => i.currency === recent.currency && Math.abs(i.time - target) <= YEAR_MATCH_DAYS * DAY_MS)
      .sort((a, b) => Math.abs(a.time - target) - Math.abs(b.time - target))[0];
    if (match) pairs.push({ ratio: recent.total / match.total, latest: recent.date!, yearEarlier: match.date! });
  }
  if (pairs.length === 0) return null;
  const rate = median(pairs.map((p) => p.ratio)) - 1;
  return { rate, latest: pairs[0].latest, yearEarlier: pairs[0].yearEarlier };
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

/**
 * Share of a yearly AWS commitment that AWS Marketplace purchases can count toward, for
 * commitments signed since 2022. Each customer's AWS contract has the exact figure.
 */
export const AWS_MARKETPLACE_CAP = 0.25;

/**
 * What buying Salesforce through AWS Marketplace saves: the AWS commitment that would otherwise go
 * unused, limited by the Salesforce bill and AWS's Marketplace cap. `null` until the customer enters
 * both AWS numbers, because we can't see whether they use AWS.
 */
export function awsCommitSaving(annualSpend: number, addOns: AddOnPrices | undefined): number | null {
  const commitment = addOns?.awsCommitmentYearly;
  const unused = addOns?.awsUnusedYearly;
  if (commitment === undefined || unused === undefined) return null;
  return Math.max(0, Math.min(annualSpend, commitment * AWS_MARKETPLACE_CAP, unused));
}

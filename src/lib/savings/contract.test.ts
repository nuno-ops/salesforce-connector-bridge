import { describe, expect, it } from "vitest";
import type { SnapshotSalesforceAccount } from "@/lib/salesforce/types";
import { awsCommitSaving, priceChange, summarizeContract } from "./contract";

const now = new Date("2026-10-11T12:00:00Z");

const contract = (over: Partial<SnapshotSalesforceAccount["contracts"][number]>) => ({
  id: "0xF1",
  number: "05741142",
  startDate: "2026-09-01",
  endDate: "2027-08-31",
  status: "Activated",
  autoRenew: false,
  billingFrequency: "Monthly",
  currency: "USD",
  ...over,
});

describe("summarizeContract", () => {
  it("returns null without account data or an active contract", () => {
    expect(summarizeContract(null, now)).toBeNull();
    expect(summarizeContract(undefined, now)).toBeNull();
    expect(summarizeContract({ contracts: [contract({ status: "Expired", endDate: "2026-08-31" })], invoices: [] }, now)).toBeNull();
  });

  it("picks the active contract and annualises its invoices", () => {
    const summary = summarizeContract(
      {
        contracts: [
          contract({ id: "0xOld", status: "Expired", endDate: "2026-08-31", billingFrequency: "Annual" }),
          contract({ id: "0xTerm", status: "Terminated", endDate: "2026-09-03", billingFrequency: "Quarterly" }),
          contract({}),
        ],
        invoices: [
          { contractId: "0xF1", date: "2026-09-30", total: 8421.2, currency: "USD" },
          { contractId: "0xF1", date: "2026-09-01", total: 8421.2, currency: "USD" },
          { contractId: "0xTerm", date: "2026-08-25", total: 25263.6, currency: "USD" },
          { contractId: "0xOld", date: "2026-07-31", total: 8503, currency: "USD" },
        ],
      },
      now,
    );
    expect(summary).toEqual({
      number: "05741142",
      endDate: "2027-08-31",
      daysLeft: 324,
      autoRenew: false,
      billingFrequency: "Monthly",
      currency: "USD",
      noticeBy: "2027-08-01",
      annualSpend: { amount: 8421.2 * 12, currency: "USD", basis: "invoices_on_contract" },
      priceChange: null,
    });
  });

  it("ignores a one-off invoice when annualising", () => {
    const summary = summarizeContract(
      {
        contracts: [contract({ billingFrequency: "Quarterly" })],
        invoices: [
          { contractId: "0xF1", date: "2026-10-01", total: 400, currency: "USD" },
          { contractId: "0xF1", date: "2026-09-01", total: 3000, currency: "USD" },
          { contractId: "0xF1", date: "2026-06-01", total: 3000, currency: "USD" },
        ],
      },
      now,
    );
    expect(summary?.annualSpend).toEqual({ amount: 12000, currency: "USD", basis: "invoices_on_contract" });
  });

  it("falls back to the last 12 months of invoices when the frequency is unknown", () => {
    const summary = summarizeContract(
      {
        contracts: [contract({ billingFrequency: null, currency: "EUR" })],
        invoices: [
          { contractId: "0xF1", date: "2026-09-01", total: 1000, currency: "EUR" },
          { contractId: "0xOther", date: "2026-01-01", total: 500, currency: "EUR" },
          { contractId: "0xOther", date: "2025-09-01", total: 9999, currency: "EUR" },
        ],
      },
      now,
    );
    expect(summary?.annualSpend).toEqual({ amount: 1500, currency: "EUR", basis: "last_12_months" });
  });

  it("has no spend when there are no invoices", () => {
    expect(summarizeContract({ contracts: [contract({})], invoices: [] }, now)?.annualSpend).toBeNull();
  });
});

describe("priceChange", () => {
  const inv = (date: string, total: number, currency = "USD") => ({ contractId: null, date, total, currency });

  it("compares the latest invoices with the ones a year earlier, across contracts", () => {
    const change = priceChange([
      inv("2026-09-30", 1070),
      inv("2026-08-31", 1070),
      inv("2026-07-31", 1070),
      inv("2025-09-30", 1000),
      inv("2025-08-29", 1000),
      inv("2025-07-31", 1000),
    ]);
    expect(change?.rate).toBeCloseTo(0.07);
    expect(change).toMatchObject({ latest: "2026-09-30", yearEarlier: "2025-09-30" });
  });

  it("works with one annual invoice a year and ignores one-offs through the median", () => {
    expect(priceChange([inv("2026-03-01", 110_000), inv("2025-03-03", 100_000)])?.rate).toBeCloseTo(0.1);
    const change = priceChange([
      inv("2026-09-30", 1000),
      inv("2026-09-15", 9000), // a one-off add-on
      inv("2026-08-31", 1000),
      inv("2025-09-30", 1000),
      inv("2025-08-31", 1000),
    ]);
    expect(change?.rate).toBeCloseTo(0);
  });

  it("needs a year of history in the same currency", () => {
    expect(priceChange([inv("2026-09-30", 1000), inv("2026-03-31", 900)])).toBeNull();
    expect(priceChange([inv("2026-09-30", 1000, "EUR"), inv("2025-09-30", 900, "USD")])).toBeNull();
    expect(priceChange([])).toBeNull();
  });
});

describe("awsCommitSaving", () => {
  it("is unknown until both AWS numbers are entered", () => {
    expect(awsCommitSaving(100_000, undefined)).toBeNull();
    expect(awsCommitSaving(100_000, { awsCommitmentYearly: 1_000_000 })).toBeNull();
  });

  it("is the smallest of the bill, the Marketplace cap and the unused commitment", () => {
    expect(awsCommitSaving(100_000, { awsCommitmentYearly: 1_000_000, awsUnusedYearly: 40_000 })).toBe(40_000);
    expect(awsCommitSaving(100_000, { awsCommitmentYearly: 200_000, awsUnusedYearly: 150_000 })).toBe(50_000);
    expect(awsCommitSaving(30_000, { awsCommitmentYearly: 1_000_000, awsUnusedYearly: 500_000 })).toBe(30_000);
  });

  it("saves nothing when the commitment will be used up", () => {
    expect(awsCommitSaving(100_000, { awsCommitmentYearly: 1_000_000, awsUnusedYearly: 0 })).toBe(0);
  });
});

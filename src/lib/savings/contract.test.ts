import { describe, expect, it } from "vitest";
import type { SnapshotSalesforceAccount } from "@/lib/salesforce/types";
import { summarizeContract } from "./contract";

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
      noticeBy: "2027-08-01",
      annualSpend: { amount: 8421.2 * 12, currency: "USD", basis: "invoices_on_contract" },
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

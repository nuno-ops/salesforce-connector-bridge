import { describe, expect, it } from "vitest";
import type { ContractSummary } from "./contract";
import type { SavingsResult } from "./engine";
import { contractStrategies } from "./strategies";

const contract: ContractSummary = {
  number: "1",
  endDate: "2027-08-31",
  daysLeft: 300,
  autoRenew: true,
  billingFrequency: "Monthly",
  currency: "USD",
  noticeBy: "2027-08-01",
  annualSpend: { amount: 100_000, currency: "USD", basis: "invoices_on_contract" },
  priceChange: { rate: 0.05, latest: "2026-09-01", yearEarlier: "2025-09-01" },
};
const result = {
  prices: { currency: "USD", fullMonthly: 165, apps: {} },
  apps: [{ name: "Conga Composer", namespace: "APXTConga4", annualCost: 12_000 }],
  connectedApps: [],
  recommendations: [{ category: "unused_seats", count: 3 }],
  users: { frozen: [], inactive: [], duplicate: [], crossOrg: [], integration: [] },
  byCategory: { unused_seats: 5_940 },
} as unknown as SavingsResult;
const snapshot = {
  organization: { edition: "Enterprise Edition" },
  userLicenses: [{ name: "Salesforce", total: 20, used: 17 }],
  packageLicenses: [],
} as never;
const at = "2026-10-12T00:00:00Z";

describe("contractStrategies", () => {
  it("lists the options with figures first", () => {
    const s = contractStrategies({
      contract,
      result,
      snapshot,
      edition: "Enterprise Edition",
      answers: { answeredAt: at, aws: "yes", awsCommitmentYearly: 1_000_000, awsUnusedYearly: 50_000, premier: "unsure", agentforce: "yes" },
    });
    expect(s.map((x) => [x.id, x.amount, x.missing])).toEqual([
      ["aws_commit", 50_000, undefined],
      ["renewal_rise", 5_000, undefined],
      ["premier", null, "answers"],
      ["aws_reseller", null, "negotiated"],
      ["flex_credits", null, undefined],
    ]);
    expect(s[0].detail).toContain("Conga Composer");
  });

  it("leaves out what the customer said doesn't apply", () => {
    const s = contractStrategies({
      contract: { ...contract, priceChange: null },
      result: { ...result, apps: [] },
      snapshot,
      edition: "Enterprise Edition",
      answers: { answeredAt: at, aws: "no", premier: "no", azure: "yes" },
    });
    expect(s).toEqual([]);
  });
});

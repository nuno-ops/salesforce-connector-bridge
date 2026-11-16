import { describe, expect, it } from "vitest";
import { awsAddOns, cloudAppSaving, cloudCommitment, nonprofitSaving, premierSaving, type CompanyAnswers } from "./answers";

const at = "2026-10-12T00:00:00Z";
const org = (edition: string, fullSeats: number, namespaces: string[] = []) => ({
  organization: { edition } as never,
  userLicenses: [{ name: "Salesforce", total: fullSeats, used: fullSeats }] as never,
  packageLicenses: namespaces.map((namespace) => ({ namespace, allowed: 10, used: 1 })) as never,
});

describe("premierSaving", () => {
  it("never applies to Unlimited, which includes Premier", () => {
    expect(premierSaving({ premier: "yes", premierYearly: 5000, answeredAt: at }, "Unlimited Edition", 100_000)).toBeNull();
  });

  it("is hidden when they said they don't pay for it", () => {
    expect(premierSaving({ premier: "no", answeredAt: at }, "Enterprise Edition", 100_000)).toBeNull();
  });

  it("asks when unanswered or unsure", () => {
    expect(premierSaving(null, "Enterprise Edition", 100_000)).toEqual({ amount: null, estimated: false });
    expect(premierSaving({ premier: "unsure", answeredAt: at }, "Enterprise Edition", 100_000)).toEqual({ amount: null, estimated: false });
  });

  it("uses the amount they entered, else 30/130 of the bill", () => {
    expect(premierSaving({ premier: "yes", premierYearly: 12_000, answeredAt: at }, "Enterprise Edition", 100_000)).toEqual({
      amount: 12_000,
      estimated: false,
    });
    const est = premierSaving({ premier: "yes", answeredAt: at }, "Enterprise Edition", 130_000);
    expect(est?.estimated).toBe(true);
    expect(est?.amount).toBeCloseTo(30_000);
    expect(premierSaving({ premier: "yes", answeredAt: at }, "Enterprise Edition", null)).toEqual({ amount: null, estimated: false });
  });
});

describe("nonprofitSaving", () => {
  const yes: CompanyAnswers = { nonprofit: "yes", answeredAt: at };

  it("only applies to nonprofits", () => {
    expect(nonprofitSaving({ nonprofit: "no", answeredAt: at }, org("Enterprise Edition", 50), 150)).toBeNull();
    expect(nonprofitSaving(null, org("Enterprise Edition", 50), 150)).toBeNull();
  });

  it("prices up to 10 licenses at the seat price", () => {
    expect(nonprofitSaving(yes, org("Enterprise Edition", 50), 150)).toEqual({ licenses: 10, annualSavings: 10 * 150 * 12 });
    expect(nonprofitSaving(yes, org("Enterprise Edition", 4), 150)).toEqual({ licenses: 4, annualSavings: 4 * 150 * 12 });
  });

  it("values donated licenses as Enterprise on Unlimited", () => {
    expect(nonprofitSaving(yes, org("Unlimited Edition", 20), 330)?.annualSavings).toBeCloseTo(10 * 165 * 12);
  });

  it("skips orgs that already run the Nonprofit Success Pack", () => {
    expect(nonprofitSaving(yes, org("Enterprise Edition", 50, ["npsp"]), 150)).toBeNull();
    expect(nonprofitSaving(yes, org("Enterprise Edition", 50), 150, ["npe01"])).toBeNull();
  });
});

describe("awsAddOns", () => {
  const answers: CompanyAnswers = { aws: "yes", awsCommitmentYearly: 1_000_000, awsUnusedYearly: 50_000, answeredAt: at };

  it("falls back to the sign-up answers", () => {
    expect(awsAddOns({ partialSandboxMonthly: 10 }, answers)).toEqual({
      partialSandboxMonthly: 10,
      awsCommitmentYearly: 1_000_000,
      awsUnusedYearly: 50_000,
    });
  });

  it("prefers numbers entered for the org", () => {
    const org = { awsCommitmentYearly: 200_000, awsUnusedYearly: 0 };
    expect(awsAddOns(org, answers)).toBe(org);
  });

  it("ignores answers other than yes", () => {
    expect(awsAddOns(undefined, { ...answers, aws: "no" })).toBeUndefined();
  });
});

describe("cloudCommitment", () => {
  it("needs a yes and both numbers", () => {
    expect(cloudCommitment(null, "azure")).toBeNull();
    expect(cloudCommitment({ answeredAt: at, azure: "no", azureCommitmentYearly: 100, azureUnusedYearly: 10 }, "azure")).toBeNull();
    expect(cloudCommitment({ answeredAt: at, azure: "yes", azureCommitmentYearly: 100 }, "azure")).toBeNull();
    expect(cloudCommitment({ answeredAt: at, google: "yes", googleCommitmentYearly: 100, googleUnusedYearly: 10 }, "google")).toEqual({
      commitment: 100,
      unused: 10,
    });
  });
});

describe("cloudAppSaving", () => {
  it("is the eligible app spend, up to the unused commitment", () => {
    expect(cloudAppSaving(5_000, null)).toBeNull();
    expect(cloudAppSaving(5_000, { commitment: 1_000_000, unused: 50_000 })).toBe(5_000);
    expect(cloudAppSaving(5_000, { commitment: 1_000_000, unused: 2_000 })).toBe(2_000);
    expect(cloudAppSaving(0, { commitment: 1_000_000, unused: 2_000 })).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { lookupKey, type LookupResults } from "@/lib/apps/marketplaces";
import { cloudOptions, pricedApps, resellerQuoteApps } from "./cloud-options";
import type { SavingsResult } from "./engine";

const result = {
  prices: { apps: {} },
  apps: [
    { name: "Conga Composer", namespace: "APXTConga4", annualCost: 12_000 },
    { name: "Free Thing", namespace: "free", annualCost: null },
  ],
  connectedApps: [
    { appName: "Docusign", salesforce: false, monthlyPrice: 500 },
    { appName: "Salesforce Mobile", salesforce: true, monthlyPrice: 10 },
  ],
} as unknown as SavingsResult;
const at = "2026-10-12T00:00:00Z";

describe("pricedApps", () => {
  it("lists installed and non-Salesforce connected apps that have a cost", () => {
    expect(pricedApps(result)).toEqual([
      { name: "Conga Composer", aliases: ["APXTConga4"], annualCost: 12_000 },
      { name: "Docusign", annualCost: 6_000 },
    ]);
  });
});

describe("cloudOptions", () => {
  it("adds eligible apps to the AWS saving", () => {
    const o = cloudOptions(result, { answeredAt: at, aws: "yes", awsCommitmentYearly: 1_000_000, awsUnusedYearly: 500_000 }, 30_000);
    expect(o.aws).toMatchObject({ saving: 42_000, appSpend: 12_000 });
    expect(o.google).toBeNull();
    expect(o.azure).toBeNull();
  });

  it("hides AWS when they said no, and without a bill", () => {
    expect(cloudOptions(result, { answeredAt: at, aws: "no" }, 30_000).aws).toBeNull();
    expect(cloudOptions(result, null, null).aws).toBeNull();
    expect(cloudOptions(result, null, 30_000).aws).toMatchObject({ saving: null });
  });

  it("shows Google Cloud and Azure only on a yes, counting apps only", () => {
    const o = cloudOptions(
      result,
      { answeredAt: at, azure: "yes", azureCommitmentYearly: 100_000, azureUnusedYearly: 4_000, google: "yes" },
      null,
    );
    expect(o.azure).toMatchObject({ saving: 4_000, appSpend: 6_000 });
    expect(o.google).toMatchObject({ saving: null, apps: [] });
  });
});

describe("resellerQuoteApps", () => {
  it("lists apps with any AWS listing, priced or not, costliest first", () => {
    const lookups: LookupResults = new Map([
      [lookupKey("aws", "Free Thing"), { counts: false, source: "https://aws/free", checked: "2026-10-12", via: "lookup", listingName: "Free Thing" }],
      [lookupKey("aws", "Docusign"), { counts: false, source: "https://aws/docusign", checked: "2026-10-12", via: "lookup" }],
    ]);
    expect(resellerQuoteApps(result, lookups).map((a) => [a.name, a.annualCost])).toEqual([
      ["Conga Composer", 12_000],
      ["Free Thing", null],
    ]);
  });

  it("is empty when nothing is listed", () => {
    expect(resellerQuoteApps({ ...result, apps: [] }, new Map())).toEqual([]);
  });
});

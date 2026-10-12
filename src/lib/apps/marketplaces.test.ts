import { describe, expect, it } from "vitest";
import { bestAwsMatch, eligibleApps, lookupKey, marketplaceStatus, normalizeAppName, type LookupResults } from "./marketplaces";

const lookup = (counts: boolean, listingName = "Listing") =>
  ({ counts, source: "https://aws.amazon.com/marketplace", checked: "2026-10-12", via: "lookup", listingName }) as const;

describe("normalizeAppName", () => {
  it("ignores case and punctuation", () => {
    expect(normalizeAppName("DocuSign, Inc.")).toBe("docusign inc");
  });
});

describe("marketplaceStatus", () => {
  it("knows hand-checked apps by name or namespace", () => {
    expect(marketplaceStatus("aws", ["Conga Composer"])).toMatchObject({ counts: true, via: "manual" });
    expect(marketplaceStatus("aws", ["Some name", "APXTConga4"])).toMatchObject({ counts: true });
    expect(marketplaceStatus("azure", ["Docusign eSignature for Salesforce", "dfsle"])).toMatchObject({ counts: true });
    expect(marketplaceStatus("aws", ["OwnBackup"])).toMatchObject({ counts: false });
    expect(marketplaceStatus("google", ["Conga Composer"])).toBeNull();
  });

  it("uses saved lookups, but hand-checked entries win", () => {
    const lookups: LookupResults = new Map([
      [lookupKey("aws", "Acme Sync"), lookup(true)],
      [lookupKey("aws", "OwnBackup"), lookup(true)],
    ]);
    expect(marketplaceStatus("aws", ["Acme Sync"], lookups)).toMatchObject({ counts: true, via: "lookup" });
    expect(marketplaceStatus("aws", ["OwnBackup"], lookups)).toMatchObject({ counts: false, via: "manual" });
    expect(marketplaceStatus("aws", ["Unknown"], lookups)).toBeNull();
  });
});

describe("eligibleApps", () => {
  it("keeps priced apps that count toward that cloud", () => {
    const lookups: LookupResults = new Map([[lookupKey("aws", "Acme Sync"), lookup(false)]]);
    const apps = [
      { name: "Conga Composer", aliases: ["APXTConga4"], annualCost: 12_000 },
      { name: "OwnBackup", annualCost: 8_000 },
      { name: "Acme Sync", annualCost: 3_000 },
      { name: "Docusign", aliases: ["dfsle"], annualCost: 6_000 },
    ];
    expect(eligibleApps("aws", apps, lookups).map((a) => a.name)).toEqual(["Conga Composer"]);
    expect(eligibleApps("azure", apps, lookups).map((a) => a.name)).toEqual(["Docusign"]);
    expect(eligibleApps("google", apps, lookups)).toEqual([]);
  });

  it("leaves out apps with no cost", () => {
    expect(eligibleApps("aws", [{ name: "Conga", annualCost: 0 }])).toEqual([]);
  });
});

describe("bestAwsMatch", () => {
  const listings = [
    { listingName: "Acme Sync Professional", deployedOnAws: false },
    { listingName: "Acme Sync (Deployed on AWS)", deployedOnAws: true },
    { listingName: "Acme Synchronizer", deployedOnAws: true },
  ];

  it("matches word for word from the start, preferring Deployed on AWS", () => {
    expect(bestAwsMatch("Acme Sync", listings)?.listingName).toBe("Acme Sync (Deployed on AWS)");
    expect(bestAwsMatch("Acme Sync", listings.slice(0, 1))?.listingName).toBe("Acme Sync Professional");
  });

  it("doesn't match partial words or very short names", () => {
    expect(bestAwsMatch("Acme Sy", listings)).toBeNull();
    expect(bestAwsMatch("AB", [{ listingName: "AB", deployedOnAws: true }])).toBeNull();
  });
});

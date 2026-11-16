import { describe, expect, it } from "vitest";
import { buildCategory, buildOptions, priceBuild, quoteUrl } from "./build-options";
import type { SavingsResult } from "./engine";

const base = (overrides: Partial<SavingsResult> = {}) =>
  ({
    prices: { fullMonthly: 165, platformMonthly: 25, integrationMonthly: 0, fullSandboxMonthly: null, source: "manual", currency: "USD" },
    apps: [],
    connectedApps: [],
    ...overrides,
  }) as unknown as SavingsResult;

const connected = (appName: string, monthlyPrice: number | null, verdict = "keep") => ({
  appName,
  category: "x",
  users: 3,
  totalUses: 100,
  lastUsed: "2026-11-10T00:00:00Z",
  verdict,
  reason: "",
  salesforce: false,
  alternative: null,
  monthlyPrice,
  annualSavings: 0,
});

describe("build instead of buy", () => {
  it("matches apps to categories, documents before forms", () => {
    expect(buildCategory("Jotform")?.key).toBe("forms");
    expect(buildCategory("Formstack Documents")?.key).toBe("documents");
    expect(buildCategory("Zapier")?.key).toBe("integrations");
    expect(buildCategory("Rollup Helper")?.key).toBe("rollups");
    expect(buildCategory("Docusign eSignature")).toBeNull();
    expect(buildCategory("JustCall SoftPhone Dialer")).toBeNull();
  });

  it("prices the build at $75 an hour, the top of the range, with 15% upkeep", () => {
    // Forms: 5 days x 8 h x $75 = $3,000 build, $450 upkeep a year.
    const o = priceBuild("Jotform", buildCategory("Jotform")!, 3000)!;
    expect(o.buildCost).toBe(3000);
    expect(o.annualUpkeep).toBe(450);
    expect(o.annualSavings).toBe(1550);
    expect(o.paybackMonths).toBe(15);
    // $1,200 a year would take 48 months to pay back: not offered.
    expect(priceBuild("Jotform", buildCategory("Jotform")!, 1200)).toBeNull();
  });

  it("only offers apps that are in use and priced, in USD reports", () => {
    const result = base({
      connectedApps: [
        connected("Zapier", 300),
        connected("Jotform", 300, "remove"),
        connected("Typeform", null),
      ] as unknown as SavingsResult["connectedApps"],
      apps: [
        { name: "Rollup Helper", namespace: "rh2", seats: null, lastActivity: null, status: "active", objectCount: 3, annualCost: 1740 },
        { name: "Conga Composer", namespace: "APXTConga4", seats: null, lastActivity: null, status: "idle", objectCount: 3, annualCost: 9000 },
      ],
    });
    expect(buildOptions(result).map((o) => o.app)).toEqual(["Zapier", "Rollup Helper"]);
    expect(buildOptions({ ...result, prices: { ...result.prices, currency: "EUR" } })).toEqual([]);
    expect(buildOptions({ ...result, sandbox: true })).toEqual([]);
  });

  it("tags the quote link with the app", () => {
    expect(quoteUrl("https://calendly.com/salesforcesaver/30min", "Zapier")).toBe(
      "https://calendly.com/salesforcesaver/30min?utm_source=salesforcesaver&utm_campaign=build_quote&utm_content=Zapier",
    );
  });
});

import { describe, expect, it } from "vitest";
import type { SavingsResult } from "@/lib/savings/engine";
import { scanEmailPlan, scanFailedEmail, scanReadyEmail, topSavings } from "./scan-ready";

const input = { orgName: "Acme <Corp>", reportUrl: "https://salesforcesaver.com/orgs/1", callUrl: "https://calendly.com/x" };

function result(recs: { title: string; annualSavings: number; advisory?: boolean; category?: string }[], annualSavings: number, currency?: string) {
  return {
    annualSavings,
    prices: { currency },
    recommendations: recs.map((r, i) => ({ id: String(i), advisory: false, ...r })),
  } as unknown as SavingsResult;
}

describe("scanEmailPlan", () => {
  it("emails the customer on the first scan or a slow one, and the owner on first scans", () => {
    expect(scanEmailPlan({ trigger: "manual", durationMs: 5000, firstForOrg: true })).toEqual({ customer: true, owner: true });
    expect(scanEmailPlan({ trigger: "manual", durationMs: 5000, firstForOrg: false })).toEqual({ customer: false, owner: false });
    expect(scanEmailPlan({ trigger: "manual", durationMs: 90_000, firstForOrg: false })).toEqual({ customer: true, owner: false });
  });
  it("never emails about weekly rescans", () => {
    expect(scanEmailPlan({ trigger: "scheduled", durationMs: 90_000, firstForOrg: true })).toEqual({ customer: false, owner: false });
  });
});

describe("scanReadyEmail", () => {
  it("leads with the yearly total and lists the biggest priced savings", () => {
    const r = result(
      [
        { title: "Remove inactive users", annualSavings: 1200 },
        { title: "Advice", annualSavings: 5000, advisory: true },
        { title: "Downgrade to Platform", annualSavings: 3000 },
        { title: "Add a price", annualSavings: 0 },
      ],
      4200,
    );
    expect(topSavings(r).map((x) => x.title)).toEqual(["Downgrade to Platform", "Remove inactive users"]);
    const email = scanReadyEmail(r, input);
    expect(email.subject).toBe("Your Salesforce scan is ready: $4,200 a year to save");
    expect(email.text).toContain("- Downgrade to Platform: $3,000 a year");
    expect(email.html).toContain("Acme &#60;Corp&#62;");
    expect(email.html).not.toContain("<Corp>");
  });
  it("doesn't name apps, like the free view", () => {
    const r = result(
      [
        { title: "Cancel JustCall: no activity for 90+ days", annualSavings: 900, category: "unused_apps" },
        { title: "Cancel Gong: unused for 90+ days", annualSavings: 600, category: "connected_apps" },
      ],
      1500,
    );
    expect(topSavings(r).map((x) => x.title)).toEqual(["Cancel or cut back 2 paid apps"]);
  });
  it("uses the contract currency", () => {
    expect(scanReadyEmail(result([], 1000, "GBP"), input).subject).toContain("£1,000");
  });
  it("still sends a useful note when nothing was priced", () => {
    const email = scanReadyEmail(result([], 0), input);
    expect(email.subject).toBe("Your Salesforce scan is ready");
    expect(email.text).toContain("Prices page");
  });
});

describe("scanFailedEmail", () => {
  it("includes the reason and a way back", () => {
    const email = scanFailedEmail("Session expired", input);
    expect(email.text).toContain("What went wrong: Session expired");
    expect(email.text).toContain(input.reportUrl);
  });
});

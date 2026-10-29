import { describe, expect, it } from "vitest";
import { formatDay, inviteEmail, nudgeEmail, renewalEmail, reviewEmail, shareEmail } from "./templates";

describe("email templates", () => {
  it("invite names the sender, escapes their note and links to the invite", () => {
    const e = inviteEmail({ from: "Ana <ana@x.com>", note: "<b>please</b>", acceptUrl: "https://s.com/invite/t", securityUrl: "https://s.com/security" });
    expect(e.subject).toContain("Ana <ana@x.com> asked you");
    expect(e.html).toContain("&#60;b&#62;please");
    expect(e.html).not.toContain("<b>please");
    expect(e.text).toContain("https://s.com/invite/t");
  });
  it("share leads with the yearly saving", () => {
    const e = shareEmail({ from: "ana@x.com", note: null, orgName: "Acme", annualSavings: 4200, currency: "USD", shareUrl: "https://s.com/share/t" });
    expect(e.subject).toBe("Salesforce savings for Acme: $4,200 a year");
  });
  it("renewal reminder gives the notice date", () => {
    const e = renewalEmail({
      orgName: "Acme",
      endDate: "2027-01-31",
      noticeBy: "2027-01-01",
      daysLeft: 45,
      annualSavings: 4200,
      currency: "USD",
      reportUrl: "https://s.com/orgs/1",
      callUrl: "https://c.com",
    });
    expect(e.subject).toBe("Salesforce renews in 45 days: $4,200 a year to cut first");
    expect(e.text).toContain("notice by 1 Jan 2027");
  });
  it("nudge and review render", () => {
    expect(nudgeEmail({ dashboardUrl: "https://s.com/dashboard", callUrl: "https://c.com" }).text).toContain("https://s.com/dashboard");
    expect(reviewEmail({ savedSoFar: 1500, currency: "USD", reviewUrl: "https://g2.com/r" }).subject).toBe("You've saved $1,500 a year on Salesforce");
  });
  it("formats dates the UK way", () => {
    expect(formatDay("2027-01-31")).toBe("31 Jan 2027");
  });
});

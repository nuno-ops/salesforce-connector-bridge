import { describe, expect, it } from "vitest";
import { countryCode, dayKey, deviceType, isBot, normalizePath, referrerHost, shortText, stepRate } from "./core";

describe("isBot", () => {
  it("treats crawlers and missing user agents as bots", () => {
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("Mozilla/5.0 (Macintosh) HeadlessChrome/120")).toBe(true);
  });
  it("lets normal browsers through", () => {
    expect(isBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15")).toBe(false);
  });
});

describe("referrerHost", () => {
  it("keeps outside hosts without www", () => {
    expect(referrerHost("https://www.g2.com/products/x", "salesforcesaver.com")).toBe("g2.com");
  });
  it("drops our own site and bad values", () => {
    expect(referrerHost("https://www.salesforcesaver.com/guides", "salesforcesaver.com")).toBeNull();
    expect(referrerHost("not a url", "salesforcesaver.com")).toBeNull();
    expect(referrerHost("", "salesforcesaver.com")).toBeNull();
  });
  it("ignores payment and sign-in hops", () => {
    expect(referrerHost("https://checkout.stripe.com/c/pay", "salesforcesaver.com")).toBeNull();
    expect(referrerHost("https://flyerclub.my.salesforce.com/", "salesforcesaver.com")).toBeNull();
    expect(referrerHost("https://accounts.google.com/o/oauth2", "salesforcesaver.com")).toBeNull();
    expect(referrerHost("https://www.google.com/", "salesforcesaver.com")).toBe("google.com");
  });
});

describe("normalizePath", () => {
  it("replaces ids and drops the query", () => {
    expect(normalizePath("/orgs/3f2b1c9e-1a2b-4c3d-8e9f-0a1b2c3d4e5f/prices?x=1")).toBe("/orgs/[id]/prices");
    expect(normalizePath("")).toBe("/");
  });
});

describe("shortText", () => {
  it("trims and caps", () => {
    expect(shortText("  hello\n world  ", 8)).toBe("hello wo");
    expect(shortText(42)).toBeNull();
    expect(shortText("   ")).toBeNull();
  });
});

describe("dayKey", () => {
  it("uses the London date", () => {
    expect(dayKey(new Date("2026-10-19T23:30:00Z"))).toBe("2026-10-20");
    expect(dayKey(new Date("2026-12-19T23:30:00Z"))).toBe("2026-12-19");
  });
});

describe("stepRate", () => {
  it("is a whole percent of the previous step", () => {
    expect(stepRate(1, 3)).toBe(33);
    expect(stepRate(0, 0)).toBeNull();
  });
});

describe("deviceType", () => {
  it("tells phones, tablets and desktops apart", () => {
    expect(deviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148")).toBe("phone");
    expect(deviceType("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile Safari/537.36")).toBe("phone");
    expect(deviceType("Mozilla/5.0 (Linux; Android 13; SM-X700) Chrome/120 Safari/537.36")).toBe("tablet");
    expect(deviceType("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet");
    expect(deviceType("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120")).toBe("desktop");
    expect(deviceType(null)).toBeNull();
  });
});

describe("countryCode", () => {
  it("reads Netlify's country headers", () => {
    expect(countryCode(new Headers({ "x-country": "pt" }))).toBe("PT");
    const geo = Buffer.from(JSON.stringify({ city: "Lisbon", country: { code: "PT", name: "Portugal" } })).toString("base64");
    expect(countryCode(new Headers({ "x-nf-geo": geo }))).toBe("PT");
  });
  it("ignores missing or broken values", () => {
    expect(countryCode(new Headers())).toBeNull();
    expect(countryCode(new Headers({ "x-nf-geo": "not-base64-json" }))).toBeNull();
    expect(countryCode(new Headers({ "x-country": "Portugal" }))).toBeNull();
  });
});

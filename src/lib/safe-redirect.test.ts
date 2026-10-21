import { describe, expect, it } from "vitest";
import { requestOrigin, safeNext } from "./safe-redirect";

describe("safeNext", () => {
  it("keeps relative paths", () => expect(safeNext("/orgs/1?x=2")).toBe("/orgs/1?x=2"));
  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
});

describe("requestOrigin", () => {
  const req = (headers: Record<string, string>, origin = "https://6ad67a--salesforcesaveropus.netlify.app") => ({
    headers: new Headers(headers),
    nextUrl: { origin },
  });
  it("prefers the forwarded host over Netlify's deploy address", () => {
    expect(requestOrigin(req({ "x-forwarded-host": "salesforcesaver.com", "x-forwarded-proto": "https" }))).toBe("https://salesforcesaver.com");
  });
  it("falls back to the Host header, then the request URL", () => {
    expect(requestOrigin(req({ host: "localhost:3000" }, "http://localhost:3000"))).toBe("http://localhost:3000");
    expect(requestOrigin(req({}, "http://localhost:3000"))).toBe("http://localhost:3000");
  });
});

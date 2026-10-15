import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-redirect";

describe("safeNext", () => {
  it("keeps relative paths", () => expect(safeNext("/orgs/1?x=2")).toBe("/orgs/1?x=2"));
  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
});

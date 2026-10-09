import { describe, expect, it } from "vitest";
import { normalizeDatabaseUrl } from "./url";

const host = "aws-0-eu-west-2.pooler.supabase.com:6543/postgres";

describe("normalizeDatabaseUrl", () => {
  it("encodes special characters in a raw password", () => {
    expect(normalizeDatabaseUrl(`postgresql://postgres.ref:pa#ss@w0rd@${host}`)).toBe(
      `postgresql://postgres.ref:pa%23ss%40w0rd@${host}`,
    );
  });

  it("leaves an already-encoded URL unchanged", () => {
    const url = `postgresql://postgres.ref:pa%23ss%40w0rd@${host}`;
    expect(normalizeDatabaseUrl(url)).toBe(url);
  });

  it("leaves URLs without a password alone", () => {
    expect(normalizeDatabaseUrl("postgres://postgres@127.0.0.1:5432/postgres")).toBe("postgres://postgres@127.0.0.1:5432/postgres");
  });
});

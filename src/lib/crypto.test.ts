import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

beforeAll(() => {
  Object.assign(process.env, {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk",
    DATABASE_URL: "postgres://localhost/test",
    SALESFORCE_CLIENT_ID: "client",
    TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
  });
});

describe("token encryption", () => {
  it("round-trips and uses a fresh IV each time", async () => {
    const { encrypt, decrypt } = await import("./crypto");
    const a = encrypt("00Dxx!secret-token");
    const b = encrypt("00Dxx!secret-token");
    expect(a).not.toBe(b);
    expect(a).not.toContain("secret");
    expect(decrypt(a)).toBe("00Dxx!secret-token");
  });

  it("rejects tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("./crypto");
    const parts = encrypt("hello").split(".");
    parts[3] = Buffer.from("jello").toString("base64url");
    expect(() => decrypt(parts.join("."))).toThrow();
  });
});

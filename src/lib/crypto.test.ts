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

describe("deriveKey", () => {
  it("uses base64 keys as-is and hashes long passphrases", async () => {
    const { deriveKey } = await import("./crypto");
    const b64 = randomBytes(32).toString("base64");
    expect(deriveKey(b64).equals(Buffer.from(b64, "base64"))).toBe(true);
    expect(deriveKey("correct horse battery staple, but longer!")).toHaveLength(32);
  });

  it("rejects short or placeholder values", async () => {
    const { deriveKey } = await import("./crypto");
    expect(() => deriveKey("openssl rand -base64 32")).toThrow(/at least 32/);
  });
});

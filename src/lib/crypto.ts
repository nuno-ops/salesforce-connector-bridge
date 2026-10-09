import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const VERSION = "v1";

/**
 * 32 random bytes in base64 (`openssl rand -base64 32`) are used as-is. Any other
 * secret of 32+ characters, such as a password-manager password, is hashed to 32 bytes.
 */
export function deriveKey(secret: string): Buffer {
  const trimmed = secret.trim();
  const raw = Buffer.from(trimmed, "base64");
  if (raw.length === 32 && /^[A-Za-z0-9+/]{43}=$/.test(trimmed)) return raw;
  if (trimmed.length >= 32) return createHash("sha256").update(trimmed).digest();
  throw new Error("TOKEN_ENCRYPTION_KEY must be at least 32 random characters (e.g. the output of `openssl rand -base64 32`)");
}

function key(): Buffer {
  return deriveKey(env().TOKEN_ENCRYPTION_KEY);
}

/** AES-256-GCM. Output: `v1.<iv>.<tag>.<ciphertext>`, each part base64url. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [VERSION, iv, cipher.getAuthTag(), data].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

export function decrypt(payload: string): string {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== VERSION || !iv || !tag || !data) throw new Error("Unrecognised encrypted payload");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

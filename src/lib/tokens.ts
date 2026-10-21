import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** A random link token and the hash we store; the token itself only ever goes in the link. */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

/** Link tokens are 32 base64url characters; anything else is rejected before touching the database. */
export function looksLikeToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{32}$/.test(value);
}

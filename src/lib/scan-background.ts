import "server-only";
import { headers } from "next/headers";
import { sign } from "@/lib/crypto";

/**
 * Hands a started scan to the Netlify background function (netlify/functions/scan-background.mjs) on the host the
 * request came in on, so an unpublished test build runs its own copy of the scan code. Netlify only routes its own
 * domains to the site, so the host can't point elsewhere. Returns false off Netlify (no SITE_ID), e.g. in local
 * development, or when the function isn't there; the caller then runs the scan itself.
 */
export async function startInBackground(scanId: string): Promise<boolean> {
  const host = (await headers()).get("host");
  if (!process.env.SITE_ID || !host) return false;
  try {
    const res = await fetch(`https://${host}/.netlify/functions/scan-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId, signature: sign(scanId) }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.status === 202;
  } catch {
    return false;
  }
}

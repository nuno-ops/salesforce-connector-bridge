/** Pure helpers for the first-party analytics, kept apart from the database code so they can be tested. */

const BOT = /bot|crawl|spider|slurp|preview|fetch|headless|lighthouse|python|curl|wget|httpclient|monitor|scan/i;

/** Crawlers, link previews and scripts. Real browsers always send a user agent. */
export function isBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT.test(userAgent);
}

/** Sites people pass through mid-flow (payment, Salesforce and Google sign-in), not where they found us. */
const IN_FLOW = /(^|\.)(stripe\.com|salesforce\.com|force\.com|accounts\.google\.com|supabase\.co|calendly\.com)$/;

/** The host a visitor came from, without "www.", or `null` for direct visits and links within our own site. */
export function referrerHost(referrer: string | null | undefined, ownHost: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    const own = (ownHost ?? "").split(":")[0].replace(/^www\./, "").toLowerCase();
    if (!host || host === own || IN_FLOW.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Groups per-org pages together, e.g. /orgs/<id>/prices becomes /orgs/[id]/prices. */
export function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0] || "/";
  return clean.replace(UUID, "[id]").slice(0, 200);
}

/** Trims untrusted text to a short single line, or `null` when empty. */
export function shortText(value: unknown, max = 100): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim().slice(0, max);
  return trimmed || null;
}

/** UK date, so the daily visitor hash rolls over at midnight in London. */
export function dayKey(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

export interface FunnelCounts {
  visitors: number;
  signedUp: number;
  connected: number;
  scanned: number;
  checkout: number;
  paid: number;
}

/** Share of the previous step that reached this one, as a whole percent, or `null` when the previous step is 0. */
export function stepRate(current: number, previous: number): number | null {
  return previous > 0 ? Math.round((current / previous) * 100) : null;
}

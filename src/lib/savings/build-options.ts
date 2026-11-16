import type { SavingsResult } from "./engine";

/**
 * "Build instead of buy": paid apps a small Salesforce build could replace, priced as what the customer
 * keeps after paying for the build and its upkeep. Shown outside the savings total: it needs a project first.
 * Pure and deterministic, worked out from the report's own app prices.
 */

/** Salesforce Saver's consultant rate, per hour, in USD. Builds are quoted only in this currency for now. */
export const BUILD_HOURLY_RATE = { amount: 75, currency: "USD" } as const;
const HOURS_PER_DAY = 8;
/** Yearly upkeep of a build, as a share of what it cost (an assumption: small fixes and Salesforce release checks). */
export const BUILD_UPKEEP_SHARE = 0.15;
/** Years the build is set against the app's cost. */
const YEARS = 3;
/** Only suggest a build that pays for itself within this many months. */
export const MAX_PAYBACK_MONTHS = 18;

export interface BuildCategory {
  key: string;
  label: string;
  match: RegExp;
  replacement: string;
  /** Effort range in working days for a simple setup; quotes use the top end. */
  days: [number, number];
}

// Order matters: the first match wins ("Formstack Documents" is a document tool, not a form).
export const BUILD_CATALOG: BuildCategory[] = [
  {
    key: "documents",
    label: "Document generation",
    match: /conga|nintex docgen|drawloop|s-docs|formstack documents|webmerge/i,
    replacement: "a PDF built from a Visualforce page, for simple templates",
    days: [3, 8],
  },
  {
    key: "forms",
    label: "Web forms",
    match: /jotform|formassembly|formstack|typeform|cognito forms|involve\.me|wufoo|fillout/i,
    replacement: "Web-to-Lead or Web-to-Case, or a Screen Flow on a Salesforce Site",
    days: [2, 5],
  },
  {
    key: "rollups",
    label: "Roll-up fields",
    match: /rollup helper/i,
    replacement: "record-triggered Flows, or the free open-source DLRS tool",
    days: [1, 3],
  },
  {
    key: "integrations",
    label: "Simple integrations",
    match: /zapier|integromat|\bmake\b|latenode|pipedream/i,
    replacement: "Flow HTTP callouts or a small Apex class",
    days: [2, 5],
  },
  {
    key: "dedupe",
    label: "Duplicate clean-up",
    match: /demandtools|cloudingo|dupeblocker|duplicatecheck/i,
    replacement: "Duplicate and Matching Rules with a scheduled Flow",
    days: [2, 4],
  },
];

export interface BuildOption {
  app: string;
  category: BuildCategory;
  /** What the app costs a year at the report's price. */
  annualCost: number;
  /** One-off build at the top of the effort range. */
  buildCost: number;
  annualUpkeep: number;
  /** Average yearly saving over three years, after the build and upkeep. */
  annualSavings: number;
  paybackMonths: number;
}

export function buildCategory(appName: string): BuildCategory | null {
  return BUILD_CATALOG.find((c) => c.match.test(appName)) ?? null;
}

/** Works out one app's build option; `null` when it doesn't pay back in time. */
export function priceBuild(app: string, category: BuildCategory, annualCost: number): BuildOption | null {
  const buildCost = category.days[1] * HOURS_PER_DAY * BUILD_HOURLY_RATE.amount;
  const annualUpkeep = Math.round(buildCost * BUILD_UPKEEP_SHARE);
  const yearlyNet = annualCost - annualUpkeep;
  if (yearlyNet <= 0) return null;
  const paybackMonths = Math.ceil((12 * buildCost) / yearlyNet);
  if (paybackMonths > MAX_PAYBACK_MONTHS) return null;
  const annualSavings = Math.round((YEARS * annualCost - buildCost - YEARS * annualUpkeep) / YEARS);
  return { app, category, annualCost, buildCost, annualUpkeep, annualSavings, paybackMonths };
}

/**
 * Apps that are in use and priced, and that a catalog build could replace. Unused apps are left out:
 * cancelling them saves more and the report already says so.
 */
export function buildOptions(result: Pick<SavingsResult, "apps" | "connectedApps" | "prices" | "sandbox">): BuildOption[] {
  if (result.sandbox || (result.prices.currency ?? "USD") !== BUILD_HOURLY_RATE.currency) return [];
  const candidates: { app: string; annualCost: number }[] = [];
  for (const a of result.apps ?? []) {
    if (a.status === "active" && a.annualCost && a.annualCost > 0) candidates.push({ app: a.name, annualCost: a.annualCost });
  }
  for (const t of result.connectedApps ?? []) {
    if (!t.salesforce && t.verdict !== "remove" && t.monthlyPrice && t.monthlyPrice > 0) candidates.push({ app: t.appName, annualCost: t.monthlyPrice * 12 });
  }
  const seen = new Set<string>();
  return candidates
    .flatMap(({ app, annualCost }) => {
      const category = buildCategory(app);
      const option = category && !seen.has(app.toLowerCase()) ? priceBuild(app, category, annualCost) : null;
      if (option) seen.add(app.toLowerCase());
      return option ? [option] : [];
    })
    .sort((a, b) => b.annualSavings - a.annualSavings);
}

/** The booking link for a quote, tagged with the app so the call starts with context. */
export function quoteUrl(calendly: string, app: string): string {
  const url = new URL(calendly);
  url.searchParams.set("utm_source", "salesforcesaver");
  url.searchParams.set("utm_campaign", "build_quote");
  url.searchParams.set("utm_content", app);
  return url.toString();
}

/** Kinds of app a build can't replace: legal validity, carriers, or the vendor's own data. Never offered for an estimate. */
const NOT_BUILDABLE = /docusign|adobe ?sign|acrobat sign|echosign|pandadoc|hellosign|dropbox sign|signnow|justcall|dialpad|aircall|ringcentral|talkdesk|five9|vonage|8x8|kixie|cloudtalk|zoom|mogli|\bsms\b|twilio|gong|chorus|otter|fireflies|avoma|zoominfo|clearbit|lusha|cognism|apollo|linkedin|slack|google|microsoft|outlook|gmail/i;
const NOT_BUILDABLE_CATEGORIES = new Set(["Salesforce tool", "E-signature", "Telephony", "Conversation intelligence", "Data enrichment"]);

export interface EstimateCandidate {
  app: string;
  /** Category from the connected-app review, when known. */
  category: string | null;
  users: number | null;
  /** Yearly cost at the report's price; `null` when no price was entered. */
  annualCost: number | null;
  lastUsed: string | null;
}

/**
 * Apps in use that we can't price a build for in real time, so the customer can ask for an estimate instead:
 * apps outside the catalog, and catalog apps with no price yet. Apps that already have a build option, didn't
 * pay back, or can't be replaced by a build are left out.
 */
export function estimateCandidates(result: Pick<SavingsResult, "apps" | "connectedApps" | "prices" | "sandbox">): EstimateCandidate[] {
  if (result.sandbox) return [];
  const priced = new Set(buildOptions(result).map((b) => b.app.toLowerCase()));
  const out = new Map<string, EstimateCandidate>();
  const add = (c: EstimateCandidate) => {
    const key = c.app.toLowerCase();
    if (priced.has(key) || out.has(key) || NOT_BUILDABLE.test(c.app) || (c.category && NOT_BUILDABLE_CATEGORIES.has(c.category))) return;
    // A catalog app with a price was already judged: it didn't pay back.
    if (buildCategory(c.app) && c.annualCost) return;
    out.set(key, c);
  };
  for (const a of result.apps ?? []) {
    if (a.status !== "active" || !a.namespace) continue;
    add({ app: a.name, category: null, users: a.seats && a.seats.used > 0 ? a.seats.used : null, annualCost: a.annualCost && a.annualCost > 0 ? a.annualCost : null, lastUsed: a.lastActivity });
  }
  for (const t of result.connectedApps ?? []) {
    if (t.salesforce || t.verdict === "remove") continue;
    add({ app: t.appName, category: t.category, users: t.users, annualCost: t.monthlyPrice && t.monthlyPrice > 0 ? t.monthlyPrice * 12 : null, lastUsed: t.lastUsed });
  }
  return [...out.values()].sort((a, b) => (b.annualCost ?? 0) - (a.annualCost ?? 0) || a.app.localeCompare(b.app));
}

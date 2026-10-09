import type { OrgSnapshot } from "@/lib/salesforce/types";

/**
 * Rule-based review of the connected apps in an org, built from OAuth token usage.
 * Pure and deterministic: no network calls, no AI.
 */

export type AppVerdict = "keep" | "review" | "consolidate" | "remove";

export interface AppReviewItem {
  appName: string;
  category: string;
  users: number;
  totalUses: number;
  lastUsed: string | null;
  verdict: AppVerdict;
  reason: string;
  /** Salesforce's own app: free with the org, so it never carries a price. */
  salesforce: boolean;
  alternative: string | null;
}

export interface AppReview {
  summary: string;
  tools: AppReviewItem[];
  overlaps: { category: string; apps: string[] }[];
}

/** No use for this many days counts as unused. */
export const UNUSED_DAYS = 90;
/** A single user with fewer uses than this is worth a second look. */
const LOW_USE_THRESHOLD = 20;

interface CatalogEntry {
  match: RegExp;
  category: string;
  /** Salesforce's own apps are never flagged as overlapping with each other. */
  salesforce?: boolean;
  alternative?: string;
}

const BI = "Salesforce reports and dashboards, or CRM Analytics";
const DEDUPE = "Salesforce Duplicate Rules and Matching Rules";
const EMAIL_SYNC = "Einstein Activity Capture (included with Sales Cloud)";
const ENGAGEMENT = "Salesforce Sales Engagement (add-on, or included in Unlimited Edition)";
const CONVERSATION = "Einstein Conversation Insights (in some Sales Cloud editions)";

// Order matters: the first match wins.
const CATALOG: CatalogEntry[] = [
  { match: /data ?loader(?!\.io)|workbench|salesforce cli|sfdx|salesforce (mobile|for (ios|android))|salesforce inspector|chatter/i, category: "Salesforce tool", salesforce: true },
  { match: /salesforce for outlook|salesforce inbox|einstein activity/i, category: "Email and calendar sync", salesforce: true },
  { match: /slack/i, category: "Collaboration", salesforce: true },
  { match: /tableau/i, category: "BI and reporting", salesforce: true },
  { match: /mulesoft|dataloader\.io/i, category: "Integration platform", salesforce: true },
  { match: /pardot|account engagement|marketing cloud/i, category: "Marketing automation", salesforce: true },
  { match: /docusign|adobe ?sign|acrobat sign|pandadoc|hellosign|dropbox sign|signnow/i, category: "E-signature" },
  { match: /conga|drawloop|nintex|s-docs|webmerge|formstack documents/i, category: "Document generation" },
  { match: /outreach|salesloft|groove|yesware|mixmax|reply\.io|vidyard/i, category: "Sales engagement", alternative: ENGAGEMENT },
  { match: /zoominfo|clearbit|lusha|cognism|apollo|seamless|sales navigator|discoverorg/i, category: "Data enrichment" },
  { match: /\bgong\b|chorus|avoma|fireflies|wingman/i, category: "Conversation intelligence", alternative: CONVERSATION },
  { match: /\bclari\b|boostup|aviso/i, category: "Forecasting" },
  { match: /hubspot|marketo|mailchimp|activecampaign|klaviyo|constant contact/i, category: "Marketing automation" },
  { match: /zapier|workato|integromat|\bmake\b|tray\.io|boomi|jitterbit|informatica|celigo/i, category: "Integration platform" },
  { match: /fivetran|stitch|airbyte|hightouch|census|\bsegment\b/i, category: "Data pipeline" },
  { match: /power ?bi|looker|domo|metabase|qlik|sisense/i, category: "BI and reporting", alternative: BI },
  { match: /outlook|microsoft 365|office 365|gmail|google workspace|cirrus insight|ebsta|revenue grid/i, category: "Email and calendar sync", alternative: EMAIL_SYNC },
  { match: /calendly|chili ?piper|savvycal/i, category: "Scheduling" },
  { match: /gearset|copado|flosum|autorabit|blue canvas/i, category: "DevOps" },
  { match: /demandtools|cloudingo|dupeblocker|ringlead|duplicatecheck/i, category: "Deduplication", alternative: DEDUPE },
  { match: /zendesk|intercom|freshdesk|helpscout|help scout/i, category: "Customer support" },
];

function classify(appName: string): CatalogEntry | null {
  return CATALOG.find((c) => c.match.test(appName)) ?? null;
}

function daysBetween(fromIso: string, toIso: string) {
  return Math.floor((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

export function reviewApps(snapshot: Pick<OrgSnapshot, "oauthTokens" | "capturedAt">): AppReview {
  const byApp = new Map<string, { users: Set<string>; totalUses: number; lastUsed: string | null }>();
  for (const t of snapshot.oauthTokens) {
    const a = byApp.get(t.appName) ?? { users: new Set(), totalUses: 0, lastUsed: null };
    a.users.add(t.userId);
    a.totalUses += t.useCount;
    if (t.lastUsedDate && (!a.lastUsed || t.lastUsedDate > a.lastUsed)) a.lastUsed = t.lastUsedDate;
    byApp.set(t.appName, a);
  }
  if (byApp.size === 0) return { summary: "No connected apps with recorded usage were found.", tools: [], overlaps: [] };

  const apps = [...byApp.entries()].map(([appName, a]) => {
    const entry = classify(appName);
    const lastUsed = a.lastUsed?.slice(0, 10) ?? null;
    const idleDays = lastUsed ? daysBetween(lastUsed, snapshot.capturedAt) : null;
    return { appName, entry, users: a.users.size, totalUses: a.totalUses, lastUsed, unused: idleDays === null || idleDays > UNUSED_DAYS };
  });

  // Third-party apps still in use that share a category with another one.
  const groups = new Map<string, string[]>();
  for (const app of apps) {
    if (!app.entry || app.entry.salesforce || app.unused) continue;
    groups.set(app.entry.category, [...(groups.get(app.entry.category) ?? []), app.appName]);
  }
  const overlaps = [...groups.entries()].filter(([, names]) => names.length > 1).map(([category, names]) => ({ category, apps: names.sort() }));
  const overlapOf = new Map(overlaps.flatMap((o) => o.apps.map((name) => [name, o] as const)));

  const tools: AppReviewItem[] = apps.map((app) => {
    const category = app.entry?.category ?? "Unrecognised";
    const usage = `${app.users} ${app.users === 1 ? "user" : "users"}, ${app.totalUses} ${app.totalUses === 1 ? "use" : "uses"}`;
    const base = { appName: app.appName, category, users: app.users, totalUses: app.totalUses, lastUsed: app.lastUsed, alternative: app.entry?.alternative ?? null, salesforce: Boolean(app.entry?.salesforce) };

    if (app.unused) {
      const when = app.lastUsed ? `last used ${app.lastUsed}` : "no recorded last use";
      if (app.entry?.salesforce) {
        return { ...base, verdict: "remove", reason: `Salesforce's own app with no use in the last ${UNUSED_DAYS} days (${when}). Revoke the unused access to tidy the org; it has no separate cost.` };
      }
      return { ...base, verdict: "remove", reason: `No use in the last ${UNUSED_DAYS} days (${when}). Revoke access and check whether it's still paid for.` };
    }
    const overlap = overlapOf.get(app.appName);
    if (overlap) {
      const others = overlap.apps.filter((n) => n !== app.appName).join(", ");
      return { ...base, verdict: "consolidate", reason: `Does the same job as ${others}. Keeping one ${category.toLowerCase()} tool usually saves a subscription.` };
    }
    if (app.entry?.salesforce) {
      return { ...base, verdict: "keep", reason: `Salesforce's own app, in use (${usage}).` };
    }
    if (app.users === 1 && app.totalUses < LOW_USE_THRESHOLD) {
      return { ...base, verdict: "review", reason: `Only one person uses it (${usage}). Check it's still needed.` };
    }
    if (!app.entry) {
      return { ...base, verdict: "review", reason: `Not an app we recognise (${usage}). Confirm what it does and who owns it.` };
    }
    return { ...base, verdict: "keep", reason: `In active use (${usage}, last used ${app.lastUsed}).` };
  });

  const order: Record<AppVerdict, number> = { remove: 0, consolidate: 1, review: 2, keep: 3 };
  tools.sort((a, b) => order[a.verdict] - order[b.verdict] || b.totalUses - a.totalUses);

  const count = (v: AppVerdict) => tools.filter((t) => t.verdict === v).length;
  const parts = [
    count("remove") && `${count("remove")} unused for ${UNUSED_DAYS}+ days`,
    count("consolidate") && `${count("consolidate")} overlapping with another app`,
    count("review") && `${count("review")} worth a closer look`,
  ].filter(Boolean);
  const summary =
    `${tools.length} connected ${tools.length === 1 ? "app has" : "apps have"} recorded usage. ` +
    (parts.length ? `${parts.join(", ")}.` : "All of them are in active use with no overlaps found.");

  return { summary, tools, overlaps };
}

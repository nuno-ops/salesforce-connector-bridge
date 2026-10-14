import type { OrgSnapshot, SnapshotUser } from "@/lib/salesforce/types";
import { LIST_PRICES, type ListPrice } from "@/lib/apps/list-prices";
import { isIntegrationApp, isPersonalApp, reviewApps, type AppReviewItem } from "@/lib/apps/review";
import { formatDate } from "@/lib/utils";
import { summarizeContract } from "./contract";
import { editionKey, effectivePriceBook, ENTERPRISE_SHARE_OF_UNLIMITED, priceForLicense, type PriceBook } from "./prices";

export const ENGINE_VERSION = 6;

export type Category =
  | "inactive_users"
  | "integration_users"
  | "platform_licenses"
  | "unused_seats"
  | "sandboxes"
  | "storage"
  | "package_licenses"
  | "view_only_users"
  | "unused_apps"
  | "connected_apps"
  | "frozen_users"
  | "duplicate_users"
  | "cross_org_users"
  | "service_cloud_users"
  | "edition";

export type Confidence = "high" | "medium" | "low";

export interface Recommendation {
  id: string;
  category: Category;
  title: string;
  detail: string;
  count: number;
  annualSavings: number;
  confidence: Confidence;
  /** Advice we can't price. Never counted in the totals. */
  advisory: boolean;
  /** Unpriced only because the customer hasn't entered a price yet; entering one turns it into a saving. */
  needsPrice?: boolean;
}

/** A recommendation that carries a dollar saving. */
export const isPriced = (r: Recommendation) => !r.advisory && r.annualSavings > 0;

/** What the report shows: dollar savings, plus the ones a price would unlock. Pure advice is left out. */
export function reportRecommendations(recommendations: Recommendation[]) {
  return {
    priced: recommendations.filter(isPriced),
    needsPrice: recommendations.filter((r) => !isPriced(r) && r.needsPrice),
  };
}

export interface FlaggedUser {
  id: string;
  name: string;
  username: string;
  email: string | null;
  profileName: string | null;
  licenseName: string | null;
  lastLoginDate: string | null;
  reason: string;
  annualSavings: number;
  confidence: Confidence;
}

export interface LicenseRow {
  name: string;
  kind: "user" | "permission_set" | "package";
  total: number;
  used: number;
  unused: number;
  /** 0–1, or `null` for unlimited/site licenses. */
  utilization: number | null;
}

export interface SavingsResult {
  engineVersion: number;
  computedAt: string;
  prices: PriceBook;
  annualSavings: number;
  monthlySavings: number;
  byCategory: Record<Category, number>;
  recommendations: Recommendation[];
  users: {
    inactive: FlaggedUser[];
    integration: FlaggedUser[];
    platform: FlaggedUser[];
    viewOnly: FlaggedUser[];
    /** Missing on results computed before engine v4. */
    frozen?: FlaggedUser[];
    duplicate?: FlaggedUser[];
    /** Missing on results computed before engine v5. */
    crossOrg?: FlaggedUser[];
    serviceCloud?: FlaggedUser[];
  };
  /** Unlimited Edition fit; `null` for other editions. Missing on results computed before engine v4. */
  edition?: EditionFit | null;
  /** Installed managed packages with a usage verdict; `null` when not collected or unreadable. */
  apps: AppUsage[] | null;
  /** Connected apps reviewed from OAuth usage, dollar savings first. Missing on results computed before engine v3. */
  connectedApps?: ConnectedAppResult[];
  licenses: LicenseRow[];
  storage: { dataUsedPct: number; fileUsedPct: number } | null;
  sandboxes: { full: number; partial: number; developer: number; total: number } | null;
  /** Full and Partial Copy sandboxes not refreshed for a year. Missing on results computed before engine v5. */
  staleSandboxes?: { name: string; type: "full" | "partial"; lastRefreshed: string; annualSavings: number }[];
  notes: string[];
}

export interface AppUsage {
  name: string;
  namespace: string | null;
  /** Paid seats from the package license, `null` when the package has no license record; -1 = site license. */
  seats: { allowed: number; used: number } | null;
  /** Latest record created or edited in any of the package's objects. */
  lastActivity: string | null;
  /** idle: objects exist but nothing changed in the window; unknown: no objects we could read. */
  status: "active" | "idle" | "unknown";
  objectCount: number;
  /** Monthly price the customer entered for this app, or `null`. */
  monthlyPrice?: number | null;
  /** The vendor's public list price, when we know it. */
  listPrice?: ListPrice | null;
  /** Which price the saving uses: the customer's, the list price, or none. */
  priceSource?: "customer" | "list" | null;
  /** Yearly saving if the recommendation is acted on; 0 when unpriced or nothing to save. */
  annualSavings?: number;
  /** What the app costs a year at the price used, whether or not it's used; `null` when unpriced. */
  annualCost?: number | null;
}

export interface EditionSignal {
  key: "full_sandbox" | "api_requests" | "custom_objects";
  label: string;
  /** true: the org needs this Unlimited extra; false: it doesn't; null: we couldn't tell. */
  needsUnlimited: boolean | null;
  detail: string;
}

export interface EditionFit {
  signals: EditionSignal[];
  /** Full licenses the saving is counted on (seats not already flagged by another check). */
  seats: number;
  annualSavings: number;
  /** The org has outgrown Enterprise (API use or custom objects), so no saving is suggested. */
  blocked: boolean;
}

export interface ConnectedAppResult extends AppReviewItem {
  /** Monthly subscription cost the customer entered, or `null`. */
  monthlyPrice: number | null;
  /** Yearly saving if the recommendation is acted on; 0 when unpriced or the app should stay. */
  annualSavings: number;
}

export interface EngineOptions {
  /** A user who hasn't logged in for this many days counts as inactive. */
  inactiveDays?: number;
  /** Token use count above which an app connection looks like an integration. */
  integrationUseCount?: number;
  /** An installed app with no record created or edited for this many days counts as unused. */
  idleAppDays?: number;
  /** Public list prices by package namespace; defaults to the built-in catalog. */
  listPrices?: Record<string, ListPrice>;
  /** The workspace's other connected orgs, to find people paying for a seat in more than one. */
  otherOrgs?: OtherOrg[];
  now?: Date;
}

/** What the cross-org check needs from another org's latest scan. */
export interface OtherOrg {
  name: string;
  /** Paid users only. `active`: created or edited records recently; `null` when that org's activity wasn't readable. */
  users: { email: string; name: string; active: boolean | null }[];
}

/** Reduces another org's snapshot to what {@link OtherOrg} needs. */
export function toOtherOrg(snapshot: OrgSnapshot): OtherOrg {
  const activity = snapshot.writeActivity;
  return {
    name: snapshot.organization.name,
    users: snapshot.users
      .filter((u) => u.email && PAID_LICENSES.has(u.licenseName ?? ""))
      .map((u) => ({ email: u.email!, name: u.name, active: activity ? (activity.byUser[u.id] ?? 0) > 0 : null })),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Salesforce's own free packages, by namespace: nothing to cancel. */
const FREE_SALESFORCE_PACKAGES = new Set(["CodeBuilder"]);
/**
 * Package objects that only hold the app's own housekeeping. An app can be busy updating your
 * Leads or Contacts while these stay quiet, so they say nothing about whether it's used.
 */
const HOUSEKEEPING_OBJECT = /((error|debug|audit|integration|sync|api|exception)_?logs?|settings?|config(uration)?s?|jobs?|queues?|batch(es)?)__c$/i;
const PAID_LICENSES = new Set(["Salesforce", "Salesforce Platform"]);
const INTEGRATION_EXAMPLE = "for example a Zapier, MuleSoft or data-sync connection, or a name like \"API User\"";
/** A Full or Partial Copy sandbox not refreshed for this long is probably not in use. */
const STALE_SANDBOX_DAYS = 365;
/** Full and Partial Copy sandboxes that come with the edition at no extra cost (Salesforce editions and pricing). */
function includedSandboxes(edition: string): { full: number; partial: number } {
  const e = edition.toLowerCase();
  if (e.includes("unlimited") || e.includes("performance")) return { full: 1, partial: 1 };
  if (e.includes("enterprise")) return { full: 0, partial: 1 };
  return { full: 0, partial: 0 };
}
const CRM_OBJECTS = ["Opportunity", "Lead", "Case"];
const INTEGRATION_NAME = /\b(integration|api|sync|etl|middleware|connector)\b/i;
const ADMIN_PROFILE = /system administrator/i;
/** Enterprise Edition limits (Salesforce limits cheat sheet): API calls per 24h and custom objects. */
const ENTERPRISE_API_BASE = 100_000;
const ENTERPRISE_API_PER_LICENSE = 1_000;
const ENTERPRISE_CUSTOM_OBJECTS = 200;
/** Leave headroom: one day's API use is a noisy sample. */
const API_HEADROOM = 0.8;

/**
 * Turns an org snapshot into priced savings opportunities.
 *
 * Each user lands in at most one bucket, checked in priority order
 * frozen → inactive → integration → duplicate → other org → platform → view-only, so savings are never
 * double counted. The Service Cloud feature license check only looks at users left in none of them.
 */
export function computeSavings(
  snapshot: OrgSnapshot,
  customerPrices: PriceBook,
  options: EngineOptions = {},
): SavingsResult {
  const now = options.now ?? new Date();
  const prices = effectivePriceBook(customerPrices, snapshot, now);
  const contract = summarizeContract(snapshot.salesforceAccount, now);
  const noticeHint = contract ? ` Tell Salesforce by ${day(contract.noticeBy)}, ahead of your ${day(contract.endDate)} renewal.` : "";
  const inactiveDays = options.inactiveDays ?? 30;
  const integrationUseCount = options.integrationUseCount ?? 1000;
  const idleAppDays = options.idleAppDays ?? 90;
  const notes: string[] = [];
  const recommendations: Recommendation[] = [];
  const claimed = new Set<string>();

  const daysSince = (iso: string | null) =>
    iso ? Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS) : null;

  // 0. Frozen users: they can't log in but still hold a license.
  const frozen: FlaggedUser[] = [];
  const frozenIds = new Set(snapshot.frozenUserIds ?? []);
  if (snapshot.frozenUserIds === null) notes.push("Frozen users weren't readable, so they're checked as inactive users instead.");
  for (const u of snapshot.users) {
    const price = priceForLicense(prices, u.licenseName);
    if (!price || !frozenIds.has(u.id)) continue;
    frozen.push(flag(u, { reason: "Frozen but still active, so the license is still used", annualSavings: price * 12, confidence: "high" }));
    claimed.add(u.id);
  }
  if (frozen.length) {
    recommendations.push({
      id: "frozen_users",
      category: "frozen_users",
      title: `Deactivate ${frozen.length} frozen ${plural(frozen.length, "user")}`,
      detail: "Freezing blocks the login but keeps the license in use. Deactivate these users to free their licenses, then drop the seats at renewal.",
      count: frozen.length,
      annualSavings: sum(frozen),
      confidence: "high",
      advisory: false,
    });
  }

  // 1. Inactive users on paid licenses.
  const inactive: FlaggedUser[] = [];
  for (const u of snapshot.users) {
    const price = priceForLicense(prices, u.licenseName);
    if (!price || claimed.has(u.id)) continue;
    const sinceLogin = daysSince(u.lastLoginDate);
    const sinceCreated = daysSince(u.createdDate);
    // Brand-new users haven't had the chance to log in yet.
    if (sinceCreated !== null && sinceCreated < inactiveDays) continue;
    if (sinceLogin !== null && sinceLogin < inactiveDays) continue;
    const confidence: Confidence = sinceLogin === null || sinceLogin >= 90 ? "high" : "medium";
    inactive.push(
      flag(u, {
        reason: sinceLogin === null ? "Never logged in" : `No login for ${sinceLogin} days`,
        annualSavings: price * 12,
        confidence,
      }),
    );
    claimed.add(u.id);
  }
  if (inactive.length) {
    recommendations.push({
      id: "inactive_users",
      category: "inactive_users",
      title: `Reclaim ${inactive.length} inactive ${plural(inactive.length, "license")}`,
      detail: `These users haven't logged in for ${inactiveDays}+ days. Freeze or deactivate them and drop the seats at renewal.`,
      count: inactive.length,
      annualSavings: sum(inactive),
      confidence: inactive.every((u) => u.confidence === "high") ? "high" : "medium",
      advisory: false,
    });
  }

  // 2. Accounts that only an integration uses: heavy use of an app that syncs systems, and none of the
  // tools a person signs in to. A person whose login also runs a connector still needs their seat.
  const usersByApp = new Map<string, Set<string>>();
  const people = new Set<string>();
  for (const t of snapshot.oauthTokens) {
    usersByApp.set(t.appName, (usersByApp.get(t.appName) ?? new Set()).add(t.userId));
    if (isPersonalApp(t.appName)) people.add(t.userId);
  }
  const tokensByUser = new Map<string, { maxUse: number; apps: Set<string> }>();
  for (const t of snapshot.oauthTokens) {
    if (people.has(t.userId)) continue;
    if (t.useCount <= integrationUseCount || !isIntegrationApp(t.appName, usersByApp.get(t.appName)!.size)) continue;
    const entry = tokensByUser.get(t.userId) ?? { maxUse: 0, apps: new Set() };
    entry.maxUse = Math.max(entry.maxUse, t.useCount);
    entry.apps.add(t.appName);
    tokensByUser.set(t.userId, entry);
  }
  const integrationLicense = snapshot.userLicenses.find((l) => l.name === "Salesforce Integration");
  let freeIntegrationSeats = integrationLicense
    ? Math.max(0, integrationLicense.total - integrationLicense.used)
    : 0;
  const integrationCandidates: { user: SnapshotUser; reason: string; confidence: Confidence; price: number }[] = [];
  for (const u of snapshot.users) {
    if (claimed.has(u.id)) continue;
    if (u.licenseName !== "Salesforce" && u.licenseName !== "Salesforce Platform") continue;
    const price = priceForLicense(prices, u.licenseName) ?? 0;
    const tokens = tokensByUser.get(u.id);
    if (tokens) {
      integrationCandidates.push({
        user: u,
        reason: `Heavy API use via ${[...tokens.apps].slice(0, 3).join(", ")}`,
        confidence: "medium",
        price,
      });
    } else if (INTEGRATION_NAME.test(`${u.name} ${u.username}`)) {
      integrationCandidates.push({ user: u, reason: "Name looks like an integration user", confidence: "low", price });
    }
  }
  // Most valuable first, so the free seats go where they save the most.
  integrationCandidates.sort((a, b) => b.price - a.price || rank(a.confidence) - rank(b.confidence));
  const integration: FlaggedUser[] = [];
  for (const c of integrationCandidates) {
    const fits = freeIntegrationSeats > 0;
    if (fits) freeIntegrationSeats -= 1;
    integration.push(
      flag(c.user, {
        reason: fits ? c.reason : `${c.reason} (no free Integration license left)`,
        annualSavings: fits ? Math.max(0, c.price - prices.integrationMonthly) * 12 : 0,
        confidence: c.confidence,
      }),
    );
    claimed.add(c.user.id);
  }
  if (integration.length) {
    const priced = integration.filter((u) => u.annualSavings > 0);
    const free = integrationLicense ? integrationLicense.total - integrationLicense.used : 0;
    const waiting = integration.length - priced.length;
    recommendations.push({
      id: "integration_users",
      category: "integration_users",
      title: priced.length
        ? `Move ${priced.length} integration ${plural(priced.length, "user")} to a free Integration license`
        : `Review ${integration.length} possible integration ${plural(integration.length, "user")}`,
      detail: `These users hold a full Salesforce license, but their logins are used by integrations (${INTEGRATION_EXAMPLE}). An integration can run on the Salesforce Integration license instead, which ${integrationLicense ? `you have ${free} free ${plural(free, "copy", "copies")} of` : "most editions include 5 of for free"}. Moving it frees the full license to drop at renewal.${waiting && integrationLicense ? ` ${waiting} more ${plural(waiting, "looks", "look")} like ${plural(waiting, "an integration", "integrations")}, but there are no free Integration licenses left for ${plural(waiting, "it", "them")}; ask your account executive what extra ones cost.` : ""}${integrationLicense ? "" : " Ask your account executive to provision them."}`,
      count: integration.length,
      annualSavings: sum(integration),
      confidence: integration.some((u) => u.confidence === "medium") ? "medium" : "low",
      advisory: priced.length === 0,
    });
  }

  // 2b. One person, several paid accounts (same email), e.g. "jdoe" and "jdoe.admin".
  const duplicate: FlaggedUser[] = [];
  const byEmail = new Map<string, SnapshotUser[]>();
  for (const u of snapshot.users) {
    if (!u.email || !priceForLicense(prices, u.licenseName)) continue;
    const key = u.email.trim().toLowerCase();
    byEmail.set(key, [...(byEmail.get(key) ?? []), u]);
  }
  for (const group of byEmail.values()) {
    if (group.length < 2) continue;
    // Keep the account used most recently; the others are extra seats.
    const sorted = [...group].sort((a, b) => (b.lastLoginDate ?? "").localeCompare(a.lastLoginDate ?? ""));
    const keeper = sorted[0];
    const sameName = group.every((u) => normName(u.name) === normName(keeper.name));
    for (const u of sorted.slice(1)) {
      if (claimed.has(u.id)) continue;
      duplicate.push(
        flag(u, {
          reason: `Same email as ${keeper.name} (${keeper.username})`,
          annualSavings: priceForLicense(prices, u.licenseName)! * 12,
          confidence: sameName ? "medium" : "low",
        }),
      );
      claimed.add(u.id);
    }
  }
  if (duplicate.length) {
    recommendations.push({
      id: "duplicate_users",
      category: "duplicate_users",
      title: `Merge ${duplicate.length} duplicate ${plural(duplicate.length, "account")}`,
      detail:
        "These paid users share an email with another active user, which usually means one person with two accounts (often a second admin login). Give the person one account and deactivate the extra. Check shared mailboxes first.",
      count: duplicate.length,
      annualSavings: sum(duplicate),
      confidence: duplicate.some((u) => u.confidence === "medium") ? "medium" : "low",
      advisory: false,
    });
  }

  // 2c. People who also hold a paid seat in another connected org, but only work in that one.
  const crossOrg: FlaggedUser[] = [];
  const otherOrgs = options.otherOrgs ?? [];
  const activityHere = snapshot.writeActivity;
  if (otherOrgs.length > 0 && activityHere) {
    const elsewhere = new Map<string, { org: string; name: string }>();
    for (const org of otherOrgs) {
      for (const o of org.users) if (o.active) elsewhere.set(o.email.trim().toLowerCase(), { org: org.name, name: o.name });
    }
    for (const u of snapshot.users) {
      const price = priceForLicense(prices, u.licenseName);
      if (!price || !u.email || claimed.has(u.id) || !PAID_LICENSES.has(u.licenseName ?? "")) continue;
      if ((activityHere.byUser[u.id] ?? 0) > 0) continue;
      const sinceCreated = daysSince(u.createdDate);
      if (sinceCreated !== null && sinceCreated < activityHere.windowDays) continue;
      const match = elsewhere.get(u.email.trim().toLowerCase());
      if (!match) continue;
      crossOrg.push(
        flag(u, {
          reason: `Works in ${match.org}; created or edited nothing here in ${activityHere.windowDays} days`,
          annualSavings: price * 12,
          confidence: "low",
        }),
      );
      claimed.add(u.id);
    }
  }
  if (crossOrg.length) {
    recommendations.push({
      id: "cross_org_users",
      category: "cross_org_users",
      title: `Stop paying twice for ${crossOrg.length} ${plural(crossOrg.length, "person", "people")} in two orgs`,
      detail: `These users also have a paid seat in another org you've connected, where they do their work. Here they haven't created or edited a record in ${activityHere!.windowDays} days. If they only look things up, share reports from the other org or give them a cheaper license, and drop the seat at renewal.${noticeHint}`,
      count: crossOrg.length,
      annualSavings: sum(crossOrg),
      confidence: "low",
      advisory: false,
    });
  }

  // 3. Full licenses that never touch core CRM objects.
  const platform: FlaggedUser[] = [];
  if (snapshot.objectPermissions.length === 0) {
    notes.push("Object permissions were not readable, so Platform license eligibility was skipped.");
  } else {
    const crmByProfile = new Set<string>();
    const crmByPermSet = new Set<string>();
    for (const p of snapshot.objectPermissions) {
      if (!p.read || !CRM_OBJECTS.includes(p.sobjectType)) continue;
      crmByPermSet.add(p.parentId);
      if (p.profileId) crmByProfile.add(p.profileId);
    }
    const permSetsByUser = new Map<string, string[]>();
    for (const a of snapshot.permissionSetAssignments) {
      const list = permSetsByUser.get(a.assigneeId) ?? [];
      list.push(a.permissionSetId);
      permSetsByUser.set(a.assigneeId, list);
    }
    const saving = Math.max(0, prices.fullMonthly - prices.platformMonthly) * 12;
    for (const u of snapshot.users) {
      if (claimed.has(u.id) || u.licenseName !== "Salesforce") continue;
      if (u.profileId && crmByProfile.has(u.profileId)) continue;
      if ((permSetsByUser.get(u.id) ?? []).some((id) => crmByPermSet.has(id))) continue;
      platform.push(
        flag(u, {
          reason: "No access to Opportunities, Leads or Cases",
          annualSavings: saving,
          confidence: "medium",
        }),
      );
      claimed.add(u.id);
    }
  }
  if (platform.length) {
    recommendations.push({
      id: "platform_licenses",
      category: "platform_licenses",
      title: `Downgrade ${platform.length} ${plural(platform.length, "user")} to Salesforce Platform`,
      detail:
        "These users hold full Salesforce licenses but can't read Opportunities, Leads or Cases. Confirm they don't need other Sales or Service Cloud features first.",
      count: platform.length,
      annualSavings: sum(platform),
      confidence: "medium",
      advisory: false,
    });
  }

  // 4. Full licenses held by people who log in but never create or edit anything.
  const viewOnly: FlaggedUser[] = [];
  const activity = snapshot.writeActivity;
  if (activity === null) {
    notes.push("Record activity wasn't readable, so the view-only user check was skipped.");
  } else if (activity === undefined) {
    notes.push("Run a new scan to check for users who log in but never edit records.");
  } else {
    const saving = Math.max(0, prices.fullMonthly - prices.platformMonthly) * 12;
    for (const u of snapshot.users) {
      if (claimed.has(u.id) || u.licenseName !== "Salesforce") continue;
      // Admins mostly change setup, not records, so they'd all look idle.
      if (u.profileName && ADMIN_PROFILE.test(u.profileName)) continue;
      const sinceCreated = daysSince(u.createdDate);
      if (sinceCreated !== null && sinceCreated < activity.windowDays) continue;
      if ((activity.byUser[u.id] ?? 0) > 0) continue;
      viewOnly.push(
        flag(u, {
          reason: `Logs in but created or edited no records in ${activity.windowDays} days`,
          annualSavings: saving,
          confidence: "low",
        }),
      );
      claimed.add(u.id);
    }
  }
  if (viewOnly.length && activity) {
    recommendations.push({
      id: "view_only_users",
      category: "view_only_users",
      title: `Right-size ${viewOnly.length} view-only ${plural(viewOnly.length, "user")}`,
      detail: `These users log in but didn't create or edit a single ${activity.objects.join(", ")} record in ${activity.windowDays} days. They may only need to see reports: consider a Platform or restricted-use license, or emailed report subscriptions. Savings assume the Platform price; ask your account executive what fits.`,
      count: viewOnly.length,
      annualSavings: sum(viewOnly),
      confidence: "low",
      advisory: false,
    });
  }

  // 4b. Service Cloud User feature licenses on people who don't work cases.
  const serviceCloud: FlaggedUser[] = [];
  const caseActivity = snapshot.writeActivity?.byObject?.Case;
  const serviceCloudIds = new Set(snapshot.serviceCloudUserIds ?? []);
  const serviceCloudPrice = prices.apps?.addOns?.serviceCloudUserMonthly;
  if (serviceCloudIds.size > 0 && caseActivity && snapshot.writeActivity) {
    for (const u of snapshot.users) {
      if (!serviceCloudIds.has(u.id) || claimed.has(u.id)) continue;
      const sinceCreated = daysSince(u.createdDate);
      if (sinceCreated !== null && sinceCreated < snapshot.writeActivity.windowDays) continue;
      if ((caseActivity[u.id] ?? 0) > 0) continue;
      serviceCloud.push(
        flag(u, {
          reason: `Service Cloud User, but created or edited no Cases in ${snapshot.writeActivity.windowDays} days`,
          annualSavings: (serviceCloudPrice ?? 0) * 12,
          confidence: "low",
        }),
      );
    }
  }
  if (serviceCloud.length) {
    const priced = serviceCloudPrice !== undefined && serviceCloudPrice > 0;
    recommendations.push({
      id: "service_cloud_users",
      category: "service_cloud_users",
      title: `Remove ${serviceCloud.length} unused Service Cloud ${plural(serviceCloud.length, "license")}`,
      detail: `These users have the Service Cloud User feature license but haven't created or edited a Case in ${snapshot.writeActivity!.windowDays} days. Untick "Service Cloud User" on their user record and buy fewer at renewal. If Service Cloud comes with your main license, there's nothing to save.${priced ? noticeHint : " Add what you pay per Service Cloud User to see the saving."}`,
      count: serviceCloud.length,
      annualSavings: sum(serviceCloud),
      confidence: "low",
      advisory: !priced,
      needsPrice: !priced,
    });
  }

  // 5. Seats paid for but never assigned.
  for (const name of ["Salesforce", "Salesforce Platform"]) {
    const lic = snapshot.userLicenses.find((l) => l.name === name);
    const price = priceForLicense(prices, name) ?? 0;
    if (!lic || lic.total <= lic.used || price === 0) continue;
    const unused = lic.total - lic.used;
    recommendations.push({
      id: `unused_seats:${name}`,
      category: "unused_seats",
      title: `Drop ${unused} unassigned ${name} ${plural(unused, "license")}`,
      detail: `You pay for ${lic.total} ${name} licenses but only ${lic.used} are assigned. Reduce the count at renewal.${noticeHint}`,
      count: unused,
      annualSavings: unused * price * 12,
      confidence: "medium",
      advisory: false,
    });
  }

  // 6. Installed apps nobody uses, and package seats nobody holds.
  const packagePrices = prices.apps?.packages ?? {};
  // Vendor list prices are in USD, so they can't be mixed into savings in another currency.
  const currency = prices.currency ?? "USD";
  const listPrices = currency === "USD" ? (options.listPrices ?? LIST_PRICES) : {};
  /** The customer's price wins; the list price fills in until they enter one. */
  const packagePrice = (namespace: string | null, seats: AppUsage["seats"]) => {
    const own = namespace ? packagePrices[namespace] : undefined;
    const list = namespace ? (listPrices[namespace] ?? null) : null;
    const seated = seats !== null && seats.allowed > 0;
    if (own !== undefined) return { source: "customer" as const, list, perSeat: seated ? own : null, flat: seated ? null : own };
    if (list) return { source: "list" as const, list, perSeat: list.unit === "user" ? list.price : null, flat: list.unit === "org" ? list.price : null };
    return { source: null, list, perSeat: null, flat: null };
  };
  const monthlyCost = (price: ReturnType<typeof packagePrice>, seats: AppUsage["seats"]) =>
    price.perSeat !== null && seats && seats.allowed > 0 ? price.perSeat * seats.allowed : price.flat;
  let apps: AppUsage[] | null = null;
  if (snapshot.installedPackages === null) {
    notes.push("Installed apps need the Tooling API and weren't readable for the connected user.");
  } else if (snapshot.installedPackages) {
    const seatsByNamespace = new Map(snapshot.packageLicenses.map((p) => [p.namespace, p]));
    apps = snapshot.installedPackages.filter((p) => !p.namespace || !FREE_SALESFORCE_PACKAGES.has(p.namespace)).map((p) => {
      const readable = p.objects.filter((o) => !o.unreadable && !HOUSEKEEPING_OBJECT.test(o.apiName));
      const lastActivity = readable.reduce<string | null>((latest, o) => {
        for (const d of [o.lastCreated, o.lastModified]) if (d && (!latest || d > latest)) latest = d;
        return latest;
      }, null);
      const since = daysSince(lastActivity);
      const status: AppUsage["status"] =
        readable.length === 0 ? "unknown" : since !== null && since < idleAppDays ? "active" : "idle";
      const lic = p.namespace ? seatsByNamespace.get(p.namespace) : undefined;
      const seats = lic ? { allowed: lic.allowed, used: lic.used } : null;
      const price = packagePrice(p.namespace, seats);
      const cost = monthlyCost(price, seats);
      return {
        name: p.name,
        namespace: p.namespace,
        seats,
        lastActivity,
        status,
        objectCount: readable.length,
        monthlyPrice: p.namespace ? (packagePrices[p.namespace] ?? null) : null,
        listPrice: price.list,
        priceSource: cost !== null ? price.source : null,
        annualSavings: status === "idle" && cost !== null ? cost * 12 : 0,
        annualCost: cost !== null ? cost * 12 : null,
      };
    });
    apps.sort(
      (a, b) => (b.annualSavings ?? 0) - (a.annualSavings ?? 0) || rankStatus(a.status) - rankStatus(b.status) || a.name.localeCompare(b.name),
    );
    // Priced apps first, then licensed ones: those are the most likely to cost money.
    for (const app of [...apps].sort((a, b) => Number(b.seats !== null) - Number(a.seats !== null))) {
      if (app.status !== "idle") continue;
      const paid = app.seats !== null;
      const saving = app.annualSavings ?? 0;
      const fromList = app.priceSource === "list" && app.listPrice;
      recommendations.push({
        id: `unused_apps:${app.namespace ?? app.name}`,
        category: "unused_apps",
        title: saving > 0 ? `Cancel ${app.name}: no activity for ${idleAppDays}+ days` : `Review ${app.name}: no activity for ${idleAppDays}+ days`,
        detail: `${app.lastActivity ? `Its ${app.objectCount} ${plural(app.objectCount, "object")} last saw a record created or edited on ${app.lastActivity.slice(0, 10)}` : `Its ${app.objectCount} ${plural(app.objectCount, "object")} hold no records`}. ${fromList ? `Cancel it with the vendor before it renews. The saving uses ${app.listPrice!.name}'s list price (${app.listPrice!.tier}, checked ${app.listPrice!.checked}); add what you pay for an exact figure.` : saving > 0 ? "Cancel it with the vendor before it renews." : paid ? "It's a licensed app, so check the vendor contract and cancel before it renews. Add its price to see the saving." : "If you pay for it, add its price to see the saving; if not, uninstalling it tidies the org."}`,
        count: 1,
        annualSavings: saving,
        confidence: paid && !fromList ? "medium" : "low",
        advisory: saving === 0,
        needsPrice: saving === 0 && app.namespace !== null,
      });
    }
  }
  // An idle app's saving already covers all of its seats.
  const idleNamespaces = new Set((apps ?? []).filter((a) => a.status === "idle" && (a.annualSavings ?? 0) > 0).map((a) => a.namespace));
  for (const p of snapshot.packageLicenses) {
    if (p.allowed < 0 || p.status !== "Active" || p.allowed <= p.used || idleNamespaces.has(p.namespace)) continue;
    const unused = p.allowed - p.used;
    const seatPrice = packagePrice(p.namespace, { allowed: p.allowed, used: p.used });
    const saving = seatPrice.perSeat !== null ? unused * seatPrice.perSeat * 12 : 0;
    const fromList = saving > 0 && seatPrice.source === "list";
    recommendations.push({
      id: `package_licenses:${p.namespace}`,
      category: "package_licenses",
      title: `${saving > 0 ? "Drop" : "Review"} ${unused} unused ${p.namespace} package ${plural(unused, "seat")}`,
      detail: `${p.used} of ${p.allowed} seats are assigned. ${fromList ? `Reduce the seat count at renewal. The saving uses the list price (${seatPrice.list!.tier}, checked ${seatPrice.list!.checked}); add what you pay for an exact figure.` : saving > 0 ? "Reduce the seat count at renewal." : "Add the seat price to see the saving, and check the vendor contract before renewal."}`,
      count: unused,
      annualSavings: saving,
      confidence: saving > 0 && !fromList ? "medium" : "low",
      advisory: saving === 0,
      needsPrice: saving === 0,
    });
  }

  // 7. Connected apps: unused or doing the same job as another app.
  const appPrices = prices.apps?.connectedApps ?? {};
  const review = reviewApps(snapshot);
  const costOf = (t: AppReviewItem) => (appPrices[t.appName] !== undefined ? appPrices[t.appName] * 12 : null);
  // In each overlap, the app with the fewest users is the one to drop.
  const dropInOverlap = new Set(
    review.overlaps.map((o) => review.tools.filter((t) => o.apps.includes(t.appName)).sort((a, b) => a.users - b.users || a.totalUses - b.totalUses)[0].appName),
  );
  const connectedApps: ConnectedAppResult[] = review.tools.map((t) => {
    const cost = costOf(t);
    const saves = t.verdict === "remove" || (t.verdict === "consolidate" && dropInOverlap.has(t.appName));
    return { ...t, monthlyPrice: appPrices[t.appName] ?? null, annualSavings: saves && cost !== null && !t.salesforce ? cost : 0 };
  });
  connectedApps.sort((a, b) => b.annualSavings - a.annualSavings);
  for (const t of connectedApps.filter((a) => a.verdict === "remove")) {
    recommendations.push({
      id: `connected_apps:${t.appName}`,
      category: "connected_apps",
      title: t.salesforce ? `Revoke unused access: ${t.appName}` : `${t.annualSavings > 0 ? "Cancel" : "Review"} ${t.appName}: unused for 90+ days`,
      detail: `${t.reason}${t.annualSavings > 0 || t.salesforce ? "" : " Add its price to see the saving."}`,
      count: t.users,
      annualSavings: t.annualSavings,
      confidence: t.annualSavings > 0 ? "medium" : "low",
      advisory: t.annualSavings === 0,
      needsPrice: t.annualSavings === 0 && !t.salesforce,
    });
  }
  for (const o of review.overlaps) {
    const drop = connectedApps.find((a) => o.apps.includes(a.appName) && dropInOverlap.has(a.appName))!;
    const keep = o.apps.filter((n) => n !== drop.appName).join(", ");
    recommendations.push({
      id: `connected_apps:overlap:${o.category}`,
      category: "connected_apps",
      title: `Consolidate ${o.category.toLowerCase()} tools: ${o.apps.join(", ")}`,
      detail: `These apps do the same job. Moving ${drop.appName}'s ${drop.users} ${plural(drop.users, "user")} onto ${keep} ${drop.annualSavings > 0 ? "saves its subscription" : "would save a subscription; add its price to see how much"}.`,
      count: o.apps.length,
      annualSavings: drop.annualSavings,
      confidence: "low",
      advisory: drop.annualSavings === 0,
      needsPrice: drop.annualSavings === 0 && !drop.salesforce,
    });
  }

  // 8. Sandboxes.
  let sandboxes: SavingsResult["sandboxes"] = null;
  const staleSandboxes: NonNullable<SavingsResult["staleSandboxes"]> = [];
  if (snapshot.sandboxes === null) {
    notes.push("Sandbox details need the Tooling API and weren't readable for the connected user.");
  } else {
    const type = (s: { licenseType: string }) => s.licenseType.toUpperCase();
    const full = snapshot.sandboxes.filter((s) => type(s).includes("FULL")).length;
    const partial = snapshot.sandboxes.filter((s) => type(s).includes("PARTIAL")).length;
    sandboxes = { full, partial, developer: snapshot.sandboxes.length - full - partial, total: snapshot.sandboxes.length };

    // Paid sandboxes nobody has refreshed in a year are usually forgotten. The ones the edition includes
    // cost nothing, so only as many stale sandboxes as the org pays for count.
    const partialPrice = prices.apps?.addOns?.partialSandboxMonthly;
    const included = includedSandboxes(snapshot.organization.edition);
    const paidLeft = { full: Math.max(0, full - included.full), partial: Math.max(0, partial - included.partial) };
    for (const sb of snapshot.sandboxes) {
      const kind = type(sb).includes("FULL") ? "full" : type(sb).includes("PARTIAL") ? "partial" : null;
      const since = daysSince(sb.lastRefreshed ?? null);
      if (!kind || since === null || since < STALE_SANDBOX_DAYS || paidLeft[kind] === 0) continue;
      paidLeft[kind]--;
      const monthly = kind === "full" ? prices.fullSandboxMonthly : (partialPrice ?? null);
      staleSandboxes.push({ name: sb.name, type: kind, lastRefreshed: sb.lastRefreshed!, annualSavings: monthly ? monthly * 12 : 0 });
    }
    if (staleSandboxes.length) {
      const saving = staleSandboxes.reduce((a, sb) => a + sb.annualSavings, 0);
      const unpriced = staleSandboxes.filter((sb) => sb.annualSavings === 0);
      const names = staleSandboxes.map((sb) => `${sb.name} (${sb.type === "full" ? "Full" : "Partial"} Copy, last refreshed ${day(sb.lastRefreshed)})`);
      recommendations.push({
        id: "stale_sandboxes",
        category: "sandboxes",
        title: `Drop ${staleSandboxes.length} ${plural(staleSandboxes.length, "sandbox", "sandboxes")} nobody has refreshed in a year`,
        detail: `${names.join("; ")}. A paid sandbox that's a year out of date is rarely used for testing. Confirm with your team, delete it and stop paying for it at renewal.${saving > 0 ? noticeHint : ""}${unpriced.length ? ` Add your ${unpriced.some((sb) => sb.type === "full") ? "Full Copy" : "Partial Copy"} sandbox price to see ${saving > 0 ? "the rest of " : ""}the saving.` : ""}`,
        count: staleSandboxes.length,
        annualSavings: saving,
        confidence: "medium",
        advisory: saving === 0,
        needsPrice: unpriced.length > 0 && saving === 0,
      });
    }

    // Stale Full Copy sandboxes are already counted above.
    const staleFull = staleSandboxes.filter((sb) => sb.type === "full").length;
    const excess = Math.max(0, full - 1 - staleFull);
    if (excess > 0) {
      const priced = prices.fullSandboxMonthly !== null;
      recommendations.push({
        id: "sandboxes",
        category: "sandboxes",
        title: `Review ${excess} extra Full Copy ${plural(excess, "sandbox", "sandboxes")}`,
        detail: `You have ${full} Full Copy sandboxes. Most teams need one; a Partial Copy is usually enough for the rest.`,
        count: excess,
        annualSavings: priced ? excess * prices.fullSandboxMonthly! * 12 : 0,
        confidence: "low",
        advisory: !priced,
        needsPrice: !priced,
      });
    }
  }

  // 8b. Unlimited Edition that would fit on Enterprise.
  let edition: EditionFit | null = null;
  if (editionKey(snapshot.organization.edition) === "unlimited") {
    const fullLicense = snapshot.userLicenses.find((l) => l.name === "Salesforce");
    const fullUsers = snapshot.users.filter((u) => u.licenseName === "Salesforce");
    const signals: EditionSignal[] = [];

    const api = snapshot.apiRequests;
    const enterpriseApi = ENTERPRISE_API_BASE + ENTERPRISE_API_PER_LICENSE * (fullLicense?.total ?? fullUsers.length);
    if (api) {
      const used = Math.max(0, api.max - api.remaining);
      signals.push({
        key: "api_requests",
        label: "API calls",
        needsUnlimited: used > enterpriseApi * API_HEADROOM,
        detail: `${used.toLocaleString("en-US")} used in the last 24 hours; Enterprise would allow about ${enterpriseApi.toLocaleString("en-US")}.`,
      });
    } else {
      signals.push({ key: "api_requests", label: "API calls", needsUnlimited: null, detail: "API usage wasn't readable." });
    }

    const objects = snapshot.ownCustomObjects;
    signals.push(
      objects === null || objects === undefined
        ? { key: "custom_objects", label: "Custom objects", needsUnlimited: null, detail: "The object list wasn't readable." }
        : {
            key: "custom_objects",
            label: "Custom objects",
            needsUnlimited: objects > ENTERPRISE_CUSTOM_OBJECTS,
            detail: `${objects} built in this org; Enterprise allows ${ENTERPRISE_CUSTOM_OBJECTS} (AppExchange apps' objects don't count).`,
          },
    );

    const fullSandboxes = sandboxes?.full ?? null;
    signals.push(
      fullSandboxes === null
        ? { key: "full_sandbox", label: "Full Copy sandbox", needsUnlimited: null, detail: "Sandbox details weren't readable." }
        : {
            key: "full_sandbox",
            label: "Full Copy sandbox",
            needsUnlimited: fullSandboxes > 0,
            detail:
              fullSandboxes > 0
                ? "In use. Unlimited includes one; on Enterprise you'd buy it as an add-on."
                : "None in use, so the one Unlimited includes goes unused.",
          },
    );

    const blocked = signals.some((s) => s.key !== "full_sandbox" && s.needsUnlimited === true);
    const unknownLimits = signals.filter((s) => s.key !== "full_sandbox" && s.needsUnlimited === null).length;
    // Seats already flagged by another check are counted there, not again here.
    const claimedFull = fullUsers.filter((u) => claimed.has(u.id)).length;
    const seats = Math.max(0, (fullLicense?.used ?? fullUsers.length) - claimedFull);
    const sandboxAddOn = fullSandboxes && prices.fullSandboxMonthly !== null ? fullSandboxes * prices.fullSandboxMonthly * 12 : 0;
    const gross = seats * prices.fullMonthly * (1 - ENTERPRISE_SHARE_OF_UNLIMITED) * 12;
    const priced = !blocked && unknownLimits < 2;
    const annualSavings = priced ? Math.max(0, gross - sandboxAddOn) : 0;
    edition = { signals, seats, annualSavings, blocked };

    // An org that has outgrown Enterprise gets no edition advice at all.
    if (!blocked && seats > 0) {
      const sandboxNote =
        fullSandboxes && fullSandboxes > 0
          ? prices.fullSandboxMonthly !== null
            ? " The saving already subtracts buying your Full Copy sandbox as an add-on."
            : " You use a Full Copy sandbox, which Enterprise charges for as an add-on: subtract its price, or add it under Prices."
          : "";
      recommendations.push({
        id: "edition",
        category: "edition",
        title: "Consider Enterprise Edition at renewal",
        detail: `You pay for Unlimited, but your API use and custom objects fit within Enterprise limits. Moving your ${seats} remaining full ${plural(seats, "license")} to Enterprise, plus any add-ons you still need (for example Premier support), could cost about half as much per seat at list prices.${sandboxNote}`,
        count: seats,
        annualSavings,
        confidence: "low",
        advisory: annualSavings === 0,
      });
    }
  }

  // 9. Storage.
  let storage: SavingsResult["storage"] = null;
  if (snapshot.storage) {
    const s = snapshot.storage;
    const pct = (max: number, remaining: number) => (max > 0 ? (max - remaining) / max : 0);
    storage = { dataUsedPct: pct(s.dataMaxMB, s.dataRemainingMB), fileUsedPct: pct(s.fileMaxMB, s.fileRemainingMB) };
    const worst = Math.max(storage.dataUsedPct, storage.fileUsedPct);
    if (worst > 0.75) {
      const which = storage.dataUsedPct >= storage.fileUsedPct ? "Data" : "File";
      recommendations.push({
        id: "storage",
        category: "storage",
        title: `${which} storage is ${Math.round(worst * 100)}% full`,
        detail: "Archive or delete old records and files before you're forced to buy extra storage.",
        count: 1,
        annualSavings: 0,
        confidence: worst > 0.9 ? "high" : "medium",
        advisory: true,
      });
    }
  }

  const licenses: LicenseRow[] = [
    ...snapshot.userLicenses.map((l) => licenseRow(l.name, "user", l.total, l.used)),
    ...snapshot.permissionSetLicenses.map((l) => licenseRow(l.name, "permission_set", l.total, l.used)),
    ...snapshot.packageLicenses.map((l) => licenseRow(l.namespace, "package", l.allowed, l.used)),
  ];

  const byCategory = {
    inactive_users: 0,
    integration_users: 0,
    platform_licenses: 0,
    unused_seats: 0,
    sandboxes: 0,
    storage: 0,
    package_licenses: 0,
    view_only_users: 0,
    unused_apps: 0,
    connected_apps: 0,
    frozen_users: 0,
    duplicate_users: 0,
    cross_org_users: 0,
    service_cloud_users: 0,
    edition: 0,
  } satisfies Record<Category, number>;
  for (const r of recommendations) if (!r.advisory) byCategory[r.category] += r.annualSavings;
  const annualSavings = Object.values(byCategory).reduce((a, b) => a + b, 0);

  recommendations.sort((a, b) => b.annualSavings - a.annualSavings || Number(a.advisory) - Number(b.advisory));

  return {
    engineVersion: ENGINE_VERSION,
    computedAt: now.toISOString(),
    prices,
    annualSavings,
    monthlySavings: annualSavings / 12,
    byCategory,
    recommendations,
    users: { inactive, integration, platform, viewOnly, frozen, duplicate, crossOrg, serviceCloud },
    edition,
    apps,
    connectedApps,
    licenses,
    storage,
    sandboxes,
    staleSandboxes,
    notes: [...snapshot.warnings, ...notes],
  };
}

function flag(
  u: SnapshotUser,
  extra: Pick<FlaggedUser, "reason" | "annualSavings" | "confidence">,
): FlaggedUser {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    profileName: u.profileName,
    licenseName: u.licenseName,
    lastLoginDate: u.lastLoginDate,
    ...extra,
  };
}

function licenseRow(name: string, kind: LicenseRow["kind"], total: number, used: number): LicenseRow {
  const unlimited = total < 0;
  return {
    name,
    kind,
    total,
    used,
    unused: unlimited ? 0 : Math.max(0, total - used),
    utilization: unlimited || total === 0 ? null : used / total,
  };
}

const day = (date: string) => formatDate(date.length === 10 ? `${date}T00:00:00` : date);
const normName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");
const sum = (users: FlaggedUser[]) => users.reduce((a, u) => a + u.annualSavings, 0);
const rankStatus = (s: AppUsage["status"]) => ({ idle: 0, unknown: 1, active: 2 })[s];
const rank = (c: Confidence) => ({ high: 0, medium: 1, low: 2 })[c];
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

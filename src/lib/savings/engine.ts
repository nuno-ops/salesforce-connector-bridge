import type { OrgSnapshot, SnapshotUser } from "@/lib/salesforce/types";
import { reviewApps, type AppReviewItem } from "@/lib/apps/review";
import { priceForLicense, type PriceBook } from "./prices";

export const ENGINE_VERSION = 3;

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
  | "connected_apps";

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
  };
  /** Installed managed packages with a usage verdict; `null` when not collected or unreadable. */
  apps: AppUsage[] | null;
  /** Connected apps reviewed from OAuth usage, dollar savings first. Missing on results computed before engine v3. */
  connectedApps?: ConnectedAppResult[];
  licenses: LicenseRow[];
  storage: { dataUsedPct: number; fileUsedPct: number } | null;
  sandboxes: { full: number; partial: number; developer: number; total: number } | null;
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
  /** Yearly saving if the recommendation is acted on; 0 when unpriced or nothing to save. */
  annualSavings?: number;
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
  now?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const CRM_OBJECTS = ["Opportunity", "Lead", "Case"];
const INTEGRATION_NAME = /\b(integration|api|sync|etl|middleware|connector)\b/i;
const ADMIN_PROFILE = /system administrator/i;

/**
 * Turns an org snapshot into priced savings opportunities.
 *
 * Each user lands in at most one bucket, checked in priority order
 * inactive → integration → platform, so savings are never double counted.
 */
export function computeSavings(
  snapshot: OrgSnapshot,
  prices: PriceBook,
  options: EngineOptions = {},
): SavingsResult {
  const now = options.now ?? new Date();
  const inactiveDays = options.inactiveDays ?? 30;
  const integrationUseCount = options.integrationUseCount ?? 1000;
  const idleAppDays = options.idleAppDays ?? 90;
  const notes: string[] = [];
  const recommendations: Recommendation[] = [];
  const claimed = new Set<string>();

  const daysSince = (iso: string | null) =>
    iso ? Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS) : null;

  // 1. Inactive users on paid licenses.
  const inactive: FlaggedUser[] = [];
  for (const u of snapshot.users) {
    const price = priceForLicense(prices, u.licenseName);
    if (!price) continue;
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

  // 2. Human licenses used by integrations.
  const tokensByUser = new Map<string, { count: number; maxUse: number; apps: Set<string> }>();
  for (const t of snapshot.oauthTokens) {
    const entry = tokensByUser.get(t.userId) ?? { count: 0, maxUse: 0, apps: new Set() };
    entry.count += 1;
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
    if (tokens && tokens.count >= 2 && tokens.maxUse > integrationUseCount) {
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
    recommendations.push({
      id: "integration_users",
      category: "integration_users",
      title: `Move ${integration.length} integration ${plural(integration.length, "user")} to Integration licenses`,
      detail: integrationLicense
        ? `${integrationLicense.total - integrationLicense.used} free Salesforce Integration ${plural(integrationLicense.total - integrationLicense.used, "license")} available. ${priced.length} of these users can move at no extra cost.`
        : "No Salesforce Integration licenses found. Most editions include 5 free; ask your account executive to provision them.",
      count: integration.length,
      annualSavings: sum(integration),
      confidence: integration.some((u) => u.confidence === "medium") ? "medium" : "low",
      advisory: priced.length === 0,
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
      detail: `You pay for ${lic.total} ${name} licenses but only ${lic.used} are assigned. Reduce the count at renewal.`,
      count: unused,
      annualSavings: unused * price * 12,
      confidence: "medium",
      advisory: false,
    });
  }

  // 6. Installed apps nobody uses, and package seats nobody holds.
  const packagePrices = prices.apps?.packages ?? {};
  let apps: AppUsage[] | null = null;
  if (snapshot.installedPackages === null) {
    notes.push("Installed apps need the Tooling API and weren't readable for the connected user.");
  } else if (snapshot.installedPackages) {
    const seatsByNamespace = new Map(snapshot.packageLicenses.map((p) => [p.namespace, p]));
    apps = snapshot.installedPackages.map((p) => {
      const readable = p.objects.filter((o) => !o.unreadable);
      const lastActivity = readable.reduce<string | null>((latest, o) => {
        for (const d of [o.lastCreated, o.lastModified]) if (d && (!latest || d > latest)) latest = d;
        return latest;
      }, null);
      const since = daysSince(lastActivity);
      const status: AppUsage["status"] =
        readable.length === 0 ? "unknown" : since !== null && since < idleAppDays ? "active" : "idle";
      const lic = p.namespace ? seatsByNamespace.get(p.namespace) : undefined;
      const seats = lic ? { allowed: lic.allowed, used: lic.used } : null;
      const monthlyPrice = p.namespace ? (packagePrices[p.namespace] ?? null) : null;
      return {
        name: p.name,
        namespace: p.namespace,
        seats,
        lastActivity,
        status,
        objectCount: p.objects.length,
        monthlyPrice,
        annualSavings: status === "idle" && monthlyPrice !== null ? packageMonthlyCost(seats, monthlyPrice) * 12 : 0,
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
      recommendations.push({
        id: `unused_apps:${app.namespace ?? app.name}`,
        category: "unused_apps",
        title: saving > 0 ? `Cancel ${app.name}: no activity for ${idleAppDays}+ days` : `Review ${app.name}: no activity for ${idleAppDays}+ days`,
        detail: `${app.lastActivity ? `Its ${app.objectCount} ${plural(app.objectCount, "object")} last saw a record created or edited on ${app.lastActivity.slice(0, 10)}` : `Its ${app.objectCount} ${plural(app.objectCount, "object")} hold no records`}. ${saving > 0 ? "Cancel it with the vendor before it renews." : paid ? "It's a licensed app, so check the vendor contract and cancel before it renews. Add its price to see the saving." : "If you pay for it, add its price to see the saving; if not, uninstalling it tidies the org."}`,
        count: 1,
        annualSavings: saving,
        confidence: paid ? "medium" : "low",
        advisory: saving === 0,
      });
    }
  }
  // An idle app's saving already covers all of its seats.
  const idleNamespaces = new Set((apps ?? []).filter((a) => a.status === "idle" && (a.annualSavings ?? 0) > 0).map((a) => a.namespace));
  for (const p of snapshot.packageLicenses) {
    if (p.allowed < 0 || p.status !== "Active" || p.allowed <= p.used || idleNamespaces.has(p.namespace)) continue;
    const unused = p.allowed - p.used;
    const price = packagePrices[p.namespace] ?? null;
    const saving = price !== null ? unused * price * 12 : 0;
    recommendations.push({
      id: `package_licenses:${p.namespace}`,
      category: "package_licenses",
      title: `${saving > 0 ? "Drop" : "Review"} ${unused} unused ${p.namespace} package ${plural(unused, "seat")}`,
      detail: `${p.used} of ${p.allowed} seats are assigned. ${saving > 0 ? "Reduce the seat count at renewal." : "Add the seat price to see the saving, and check the vendor contract before renewal."}`,
      count: unused,
      annualSavings: saving,
      confidence: saving > 0 ? "medium" : "low",
      advisory: saving === 0,
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
    });
  }

  // 8. Sandboxes.
  let sandboxes: SavingsResult["sandboxes"] = null;
  if (snapshot.sandboxes === null) {
    notes.push("Sandbox details need the Tooling API and weren't readable for the connected user.");
  } else {
    const type = (s: { licenseType: string }) => s.licenseType.toUpperCase();
    const full = snapshot.sandboxes.filter((s) => type(s).includes("FULL")).length;
    const partial = snapshot.sandboxes.filter((s) => type(s).includes("PARTIAL")).length;
    sandboxes = { full, partial, developer: snapshot.sandboxes.length - full - partial, total: snapshot.sandboxes.length };
    const excess = Math.max(0, full - 1);
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
    users: { inactive, integration, platform, viewOnly },
    apps,
    connectedApps,
    licenses,
    storage,
    sandboxes,
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

const sum = (users: FlaggedUser[]) => users.reduce((a, u) => a + u.annualSavings, 0);
/** Monthly cost of a package: per seat when it has a seat count, otherwise the price is the monthly total. */
function packageMonthlyCost(seats: AppUsage["seats"], price: number) {
  return seats && seats.allowed > 0 ? seats.allowed * price : price;
}

const rankStatus = (s: AppUsage["status"]) => ({ idle: 0, unknown: 1, active: 2 })[s];
const rank = (c: Confidence) => ({ high: 0, medium: 1, low: 2 })[c];
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

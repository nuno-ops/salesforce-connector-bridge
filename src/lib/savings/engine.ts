import type { OrgSnapshot, SnapshotUser } from "@/lib/salesforce/types";
import { priceForLicense, type PriceBook } from "./prices";

export const ENGINE_VERSION = 1;

export type Category =
  | "inactive_users"
  | "integration_users"
  | "platform_licenses"
  | "unused_seats"
  | "sandboxes"
  | "storage"
  | "package_licenses";

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
  };
  licenses: LicenseRow[];
  storage: { dataUsedPct: number; fileUsedPct: number } | null;
  sandboxes: { full: number; partial: number; developer: number; total: number } | null;
  notes: string[];
}

export interface EngineOptions {
  /** A user who hasn't logged in for this many days counts as inactive. */
  inactiveDays?: number;
  /** Token use count above which an app connection looks like an integration. */
  integrationUseCount?: number;
  now?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const CRM_OBJECTS = ["Opportunity", "Lead", "Case"];
const INTEGRATION_NAME = /\b(integration|api|sync|etl|middleware|connector)\b/i;

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

  // 4. Seats paid for but never assigned.
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

  // 5. Managed package seats nobody uses.
  for (const p of snapshot.packageLicenses) {
    if (p.allowed < 0 || p.status !== "Active" || p.allowed <= p.used) continue;
    const unused = p.allowed - p.used;
    recommendations.push({
      id: `package_licenses:${p.namespace}`,
      category: "package_licenses",
      title: `Review ${unused} unused ${p.namespace} package ${plural(unused, "seat")}`,
      detail: `${p.used} of ${p.allowed} seats are assigned. Check the vendor contract before renewal.`,
      count: unused,
      annualSavings: 0,
      confidence: "low",
      advisory: true,
    });
  }

  // 6. Sandboxes.
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

  // 7. Storage.
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
    users: { inactive, integration, platform },
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
const rank = (c: Confidence) => ({ high: 0, medium: 1, low: 2 })[c];
const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

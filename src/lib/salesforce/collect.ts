import { SF_API_VERSION, SalesforceAuthError, type SalesforceClient } from "./client";
import type {
  OrgSnapshot,
  SnapshotDeactivation,
  SnapshotInstalledPackage,
  SnapshotPageUsage,
  SnapshotSalesforceAccount,
  SnapshotStorageDetail,
  SnapshotWriteActivity,
  StorageGrowthObject,
} from "./types";

// Raw record shapes, limited to the fields we select.
interface UserRecord {
  Id: string;
  Name: string;
  Username: string;
  Email: string | null;
  UserType: string;
  ProfileId: string | null;
  Profile: { Name: string; UserLicense: { Name: string } | null } | null;
  LastLoginDate: string | null;
  CreatedDate: string | null;
}
interface ObjectPermissionRecord {
  ParentId: string;
  Parent: { ProfileId: string | null; IsOwnedByProfile: boolean } | null;
  SobjectType: string;
  PermissionsRead: boolean;
  PermissionsCreate: boolean;
  PermissionsEdit: boolean;
  PermissionsDelete: boolean;
}
interface Limits {
  DailyApiRequests?: { Max: number; Remaining: number };
  DataStorageMB?: { Max: number; Remaining: number };
  FileStorageMB?: { Max: number; Remaining: number };
}

/** Days of Lightning page views the licence fit checks look at. */
export const PAGE_WINDOW_DAYS = 90;
/** Pages that only Sales Cloud users can open. Opening any of them means the user needs a Sales license. */
export const SALES_PAGES = ["Opportunity", "Lead", "Campaign", "Quote", "Contract", "Forecast"] as const;

function pageNameFilter(prefixes: readonly string[]) {
  return prefixes.map((p) => `PageName LIKE '${p}%'`).join(" OR ");
}

export const deactivatedUsersQuery = (ids: string[]) =>
  `SELECT Id, LastLoginDate, Profile.UserLicense.Name FROM User WHERE IsActive = false AND Id IN (${ids.map((id) => `'${id.replace(/[^A-Za-z0-9]/g, "")}'`).join(", ")})`;

/** Custom object pages each user opened. Only the object name in front of the page name is kept, e.g. "Invoice__c" from "Invoice__c Record". */
export const customObjectPagesQuery = (userIds: string[]) =>
  `SELECT UserId u, PageName p FROM LightningUsageByPageMetrics WHERE MetricsDate = LAST_N_DAYS:${PAGE_WINDOW_DAYS} AND UserId IN (${userIds.map((id) => `'${id.replace(/[^A-Za-z0-9]/g, "")}'`).join(", ")}) AND PageName LIKE '%\\_\\_c %' GROUP BY UserId, PageName`;

export const QUERIES = {
  organization: "SELECT Id, Name, OrganizationType, IsSandbox FROM Organization LIMIT 1",
  users:
    "SELECT Id, Name, Username, Email, UserType, ProfileId, Profile.Name, Profile.UserLicense.Name, LastLoginDate, CreatedDate FROM User WHERE IsActive = true",
  objectPermissions:
    "SELECT ParentId, Parent.ProfileId, Parent.IsOwnedByProfile, SobjectType, PermissionsRead, PermissionsCreate, PermissionsEdit, PermissionsDelete FROM ObjectPermissions WHERE SobjectType IN ('Opportunity', 'Lead', 'Case')",
  permissionSetAssignments: "SELECT AssigneeId, PermissionSetId FROM PermissionSetAssignment WHERE Assignee.IsActive = true",
  oauthTokens: "SELECT Id, AppName, UserId, UseCount, LastUsedDate FROM OauthToken WHERE UseCount > 0",
  userLicenses: "SELECT Id, Name, TotalLicenses, UsedLicenses FROM UserLicense",
  packageLicenses: "SELECT Id, NamespacePrefix, Status, AllowedLicenses, UsedLicenses FROM PackageLicense",
  permissionSetLicenses: "SELECT Id, MasterLabel, TotalLicenses, UsedLicenses FROM PermissionSetLicense",
  sandboxes: "SELECT SandboxName, LicenseType, Description FROM SandboxInfo",
  // Latest completed copy per sandbox, i.e. when it was last created or refreshed.
  sandboxRefreshes: "SELECT SandboxName, EndDate FROM SandboxProcess WHERE Status = 'Completed' ORDER BY EndDate DESC",
  frozenUsers: "SELECT UserId FROM UserLogin WHERE IsFrozen = true",
  // A separate query: the field only exists in orgs with Service Cloud, and the users query must not fail without it.
  serviceCloudUsers: "SELECT Id FROM User WHERE IsActive = true AND UserPermissionsSupportUser = true",
  installedPackages:
    "SELECT SubscriberPackage.NamespacePrefix, SubscriberPackage.Name FROM InstalledSubscriberPackage",
  // Your Account objects. SalesforceContract also holds payment card fields: never select them.
  salesforceContracts:
    "SELECT Id, ContractNumber, StartDate, EndDate, SalesforceContractStatus, AutoRenewCode, BillingFrequency, ContractCurrency FROM SalesforceContract",
  salesforceInvoices:
    "SELECT SalesforceContractId, InvoiceDate, TotalAmount, InvoiceCurrency FROM SalesforceInvoice WHERE InvoiceDate = LAST_N_DAYS:730 ORDER BY InvoiceDate DESC",
  // Lightning usage (the data behind Salesforce's Lightning Usage app): page view counts per user, never what was on the page.
  pageViews: `SELECT UserId u, SUM(TotalCount) c FROM LightningUsageByPageMetrics WHERE MetricsDate = LAST_N_DAYS:${PAGE_WINDOW_DAYS} GROUP BY UserId`,
  salesPageViews: `SELECT UserId u, SUM(TotalCount) c FROM LightningUsageByPageMetrics WHERE MetricsDate = LAST_N_DAYS:${PAGE_WINDOW_DAYS} AND (${pageNameFilter(SALES_PAGES)}) GROUP BY UserId`,
  casePageViews: `SELECT UserId u, SUM(TotalCount) c FROM LightningUsageByPageMetrics WHERE MetricsDate = LAST_N_DAYS:${PAGE_WINDOW_DAYS} AND (${pageNameFilter(["Case"])}) GROUP BY UserId`,
  mobileUsers: `SELECT UserId u FROM LightningUsageByAppTypeMetrics WHERE MetricsDate = LAST_N_DAYS:${PAGE_WINDOW_DAYS} AND AppExperience = 'Salesforce Mobile' GROUP BY UserId`,
  monthlyActiveUsers:
    "SELECT CALENDAR_YEAR(MetricsDate) y, CALENDAR_MONTH(MetricsDate) m, User.Profile.UserLicense.Name l, COUNT_DISTINCT(UserId) c FROM LightningUsageByPageMetrics WHERE MetricsDate = LAST_N_DAYS:365 GROUP BY CALENDAR_YEAR(MetricsDate), CALENDAR_MONTH(MetricsDate), User.Profile.UserLicense.Name",
  // Only the date and the user Id in the text are kept; the text itself isn't stored.
  deactivations: "SELECT Display, CreatedDate FROM SetupAuditTrail WHERE Action = 'deactivateduser' AND CreatedDate = LAST_N_DAYS:180",
} as const;

/** How the storage checks define "old" and "recent". */
export const STORAGE_WINDOWS = { oldActivityYears: 3, oldEmailYears: 1, oldCampaignYears: 2, growthWindowDays: 30, emailSample: 50 } as const;
export const STORAGE_GROWTH_OBJECTS = ["Task", "Event", "EmailMessage", "CampaignMember"] as const satisfies readonly StorageGrowthObject[];

/** Run with queryAll so archived activities count too; deleted rows are left out. `before` is a SOQL datetime. */
export const oldActivityQuery = (object: "Task" | "Event", before: string) =>
  `SELECT COUNT(Id) c FROM ${object} WHERE IsDeleted = false AND CreatedDate < ${before}`;
export const emailCountQuery = (before?: string) => `SELECT COUNT(Id) c FROM EmailMessage${before ? ` WHERE CreatedDate < ${before}` : ""}`;
/** Only the length of each body is kept, in memory; the text itself is never stored. */
export const emailSampleQuery = `SELECT HtmlBody, TextBody FROM EmailMessage ORDER BY CreatedDate DESC LIMIT ${STORAGE_WINDOWS.emailSample}`;
/** `before` is a SOQL date (campaign end dates have no time). */
export const oldCampaignMembersQuery = (before: string) =>
  `SELECT COUNT(Id) c FROM CampaignMember WHERE Campaign.IsActive = false AND Campaign.EndDate < ${before}`;
export const storageGrowthQuery = (object: StorageGrowthObject) =>
  `SELECT CreatedById u, COUNT(Id) c FROM ${object} WHERE CreatedDate = LAST_N_DAYS:${STORAGE_WINDOWS.growthWindowDays} GROUP BY CreatedById`;

/** Objects whose creates and edits count as someone actually working in Salesforce. */
export const ACTIVITY_OBJECTS = ["Account", "Contact", "Lead", "Opportunity", "Case", "Task", "Event"] as const;
export const ACTIVITY_WINDOW_DAYS = 90;
/** Caps that keep the installed-app check to a bounded number of API calls. */
const MAX_OBJECTS_PER_PACKAGE = 8;
const MAX_PACKAGE_OBJECTS = 80;

export const activityQuery = (object: string, field: "CreatedById" | "LastModifiedById") => {
  const date = field === "CreatedById" ? "CreatedDate" : "LastModifiedDate";
  return `SELECT ${field} u, COUNT(Id) c FROM ${object} WHERE ${date} = LAST_N_DAYS:${ACTIVITY_WINDOW_DAYS} GROUP BY ${field}`;
};

export const packageObjectsQuery = (namespace: string) =>
  `SELECT QualifiedApiName, Label FROM EntityDefinition WHERE NamespacePrefix = '${namespace.replace(/[^A-Za-z0-9_]/g, "")}'`;

export const lastActivityQuery = (object: string) => `SELECT MAX(CreatedDate) c, MAX(LastModifiedDate) m FROM ${object}`;

/**
 * Reads everything the savings engine needs from an org.
 * Users, licenses and the organization are required; anything else that fails
 * (usually missing permissions) becomes a warning instead of failing the scan.
 */
export async function collectSnapshot(client: SalesforceClient, now = new Date()): Promise<OrgSnapshot> {
  const warnings: string[] = [];
  const optional = async <T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await run();
    } catch (e) {
      if (e instanceof SalesforceAuthError) throw e;
      warnings.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
      return fallback;
    }
  };

  const [org, users, userLicenses, objectPermissions, assignments, tokens, packages, psLicenses, limits, sandboxes, writeActivity, installedPackages, frozen, globalDescribe, salesforceAccount, refreshes, serviceCloud, pageUsage, deactivations, storageDetail] =
    await Promise.all([
      client.query<{ Id: string; Name: string; OrganizationType: string; IsSandbox: boolean }>(QUERIES.organization),
      client.query<UserRecord>(QUERIES.users),
      client.query<{ Id: string; Name: string; TotalLicenses: number; UsedLicenses: number }>(QUERIES.userLicenses),
      optional("Object permissions", () => client.query<ObjectPermissionRecord>(QUERIES.objectPermissions), []),
      optional(
        "Permission set assignments",
        () => client.query<{ AssigneeId: string; PermissionSetId: string }>(QUERIES.permissionSetAssignments),
        [],
      ),
      optional(
        "Connected app usage",
        () =>
          client.query<{ Id: string; AppName: string; UserId: string; UseCount: number; LastUsedDate: string | null }>(
            QUERIES.oauthTokens,
          ),
        [],
      ),
      optional(
        "Package licenses",
        () =>
          client.query<{ Id: string; NamespacePrefix: string; Status: string; AllowedLicenses: number; UsedLicenses: number }>(
            QUERIES.packageLicenses,
          ),
        [],
      ),
      optional(
        "Permission set licenses",
        () =>
          client.query<{ Id: string; MasterLabel: string; TotalLicenses: number; UsedLicenses: number }>(
            QUERIES.permissionSetLicenses,
          ),
        [],
      ),
      optional("Org limits", () => client.get<Limits>(`/services/data/${SF_API_VERSION}/limits`), null),
      optional(
        "Sandboxes",
        () =>
          client.query<{ SandboxName: string; LicenseType: string; Description: string | null }>(QUERIES.sandboxes, {
            tooling: true,
          }),
        null,
      ),
      collectWriteActivity(client, warnings),
      optional("Installed apps", () => collectInstalledPackages(client), null),
      optional("Frozen users", () => client.query<{ UserId: string }>(QUERIES.frozenUsers), null),
      optional(
        "Object list",
        () => client.get<{ sobjects: { name: string; custom: boolean }[] }>(`/services/data/${SF_API_VERSION}/sobjects`),
        null,
      ),
      collectSalesforceAccount(client).catch((e) => {
        if (e instanceof SalesforceAuthError) throw e;
        warnings.push(
          "Your Salesforce contract and invoices weren't readable. Connect as a user with the Manage Billing permission to see your renewal date and yearly Salesforce bill.",
        );
        return null;
      }),
      // Optional extras: without them the related checks are skipped, so no warning.
      client
        .query<{ SandboxName: string; EndDate: string | null }>(QUERIES.sandboxRefreshes, { tooling: true })
        .catch((e) => {
          if (e instanceof SalesforceAuthError) throw e;
          return null;
        }),
      client.query<{ Id: string }>(QUERIES.serviceCloudUsers).catch((e) => {
        if (e instanceof SalesforceAuthError) throw e;
        return null;
      }),
      optional("Lightning usage", () => collectPageUsage(client), null),
      optional("Deactivated users", () => collectDeactivations(client), null),
      // Optional extra: without it the storage clean-up checks are skipped, so no warning.
      collectStorageDetail(client, now).catch((e) => {
        if (e instanceof SalesforceAuthError) throw e;
        return null;
      }),
    ]);

  const organization = org[0];
  if (!organization) throw new Error("Couldn't read the Organization record.");


  return {
    version: 1,
    capturedAt: now.toISOString(),
    organization: {
      id: organization.Id,
      name: organization.Name,
      edition: organization.OrganizationType,
      isSandbox: organization.IsSandbox,
      instanceUrl: client.instanceUrl,
    },
    users: users.map((u) => ({
      id: u.Id,
      name: u.Name,
      username: u.Username,
      email: u.Email,
      userType: u.UserType,
      profileId: u.ProfileId,
      profileName: u.Profile?.Name ?? null,
      licenseName: u.Profile?.UserLicense?.Name ?? null,
      lastLoginDate: u.LastLoginDate,
      createdDate: u.CreatedDate,
    })),
    objectPermissions: objectPermissions.map((p) => ({
      parentId: p.ParentId,
      profileId: p.Parent?.IsOwnedByProfile ? p.Parent.ProfileId : null,
      sobjectType: p.SobjectType,
      read: p.PermissionsRead,
      create: p.PermissionsCreate,
      edit: p.PermissionsEdit,
      delete: p.PermissionsDelete,
    })),
    permissionSetAssignments: assignments.map((a) => ({ assigneeId: a.AssigneeId, permissionSetId: a.PermissionSetId })),
    oauthTokens: tokens.map((t) => ({
      id: t.Id,
      appName: t.AppName,
      userId: t.UserId,
      useCount: t.UseCount,
      lastUsedDate: t.LastUsedDate,
    })),
    userLicenses: userLicenses.map((l) => ({ id: l.Id, name: l.Name, total: l.TotalLicenses, used: l.UsedLicenses })),
    packageLicenses: packages.map((p) => ({
      id: p.Id,
      namespace: p.NamespacePrefix,
      status: p.Status,
      allowed: p.AllowedLicenses,
      used: p.UsedLicenses,
    })),
    permissionSetLicenses: psLicenses.map((l) => ({ id: l.Id, name: l.MasterLabel, total: l.TotalLicenses, used: l.UsedLicenses })),
    storage:
      limits?.DataStorageMB && limits.FileStorageMB
        ? {
            dataMaxMB: limits.DataStorageMB.Max,
            dataRemainingMB: limits.DataStorageMB.Remaining,
            fileMaxMB: limits.FileStorageMB.Max,
            fileRemainingMB: limits.FileStorageMB.Remaining,
          }
        : null,
    sandboxes:
      sandboxes?.map((s) => ({
        name: s.SandboxName,
        licenseType: s.LicenseType,
        description: s.Description,
        // Newest first, so the first match is the latest refresh.
        lastRefreshed: refreshes ? (refreshes.find((r) => r.SandboxName === s.SandboxName)?.EndDate ?? null) : null,
      })) ?? null,
    writeActivity,
    installedPackages,
    frozenUserIds: frozen?.map((f) => f.UserId) ?? null,
    serviceCloudUserIds: serviceCloud?.map((u) => u.Id) ?? null,
    apiRequests: limits?.DailyApiRequests ? { max: limits.DailyApiRequests.Max, remaining: limits.DailyApiRequests.Remaining } : null,
    ownCustomObjects: Array.isArray(globalDescribe?.sobjects) ? globalDescribe.sobjects.filter((o) => isOwnCustomObject(o.name)).length : null,
    salesforceAccount,
    pageUsage,
    deactivations,
    storageDetail,
    warnings,
  };
}

/** `now` minus whole years, as a SOQL datetime (`2023-11-13T00:00:00Z`) or date (`2023-11-13`). */
export function yearsBefore(now: Date, years: number, kind: "datetime" | "date" = "datetime"): string {
  const d = new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()));
  const date = d.toISOString().slice(0, 10);
  return kind === "date" ? date : `${date}T00:00:00Z`;
}

const utf8Bytes = (text: string | null) => (text ? new TextEncoder().encode(text).length : 0);

/**
 * What fills data storage: record counts only, plus the average size of recent email bodies.
 * Each part that fails is left out; the whole thing is `null` only when nothing was readable.
 */
async function collectStorageDetail(client: SalesforceClient, now: Date): Promise<SnapshotStorageDetail | null> {
  const w = STORAGE_WINDOWS;
  const swallow = <T,>(p: Promise<T>): Promise<T | null> =>
    p.catch((e) => {
      if (e instanceof SalesforceAuthError) throw e;
      return null;
    });
  const count = async (soql: string, all = false) => {
    const [row] = await client.query<{ c: number }>(soql, { all });
    return row?.c ?? 0;
  };
  const oldActivityBefore = yearsBefore(now, w.oldActivityYears);
  const [task, event, emailTotal, emailOld, sample, campaignMembers, ...growthRows] = await Promise.all([
    swallow(count(oldActivityQuery("Task", oldActivityBefore), true)),
    swallow(count(oldActivityQuery("Event", oldActivityBefore), true)),
    swallow(count(emailCountQuery())),
    swallow(count(emailCountQuery(yearsBefore(now, w.oldEmailYears)))),
    swallow(client.query<{ HtmlBody: string | null; TextBody: string | null }>(emailSampleQuery)),
    swallow(count(oldCampaignMembersQuery(yearsBefore(now, w.oldCampaignYears, "date")))),
    ...STORAGE_GROWTH_OBJECTS.map((o) => swallow(client.query<{ u: string | null; c: number }>(storageGrowthQuery(o)))),
  ]);

  const oldActivities: SnapshotStorageDetail["oldActivities"] = {};
  if (task !== null) oldActivities.Task = task;
  if (event !== null) oldActivities.Event = event;

  let emails: SnapshotStorageDetail["emails"] = null;
  if (emailTotal !== null && emailOld !== null) {
    const n = sample?.length ?? 0;
    const avg = (pick: (r: { HtmlBody: string | null; TextBody: string | null }) => string | null) =>
      n ? Math.round(sample!.reduce((a, r) => a + utf8Bytes(pick(r)), 0) / n) : 0;
    emails = {
      total: emailTotal,
      old: emailOld,
      oldEmailYears: w.oldEmailYears,
      sampleSize: n,
      avgHtmlBytes: avg((r) => r.HtmlBody),
      avgTextBytes: avg((r) => r.TextBody),
    };
  }

  const growth: SnapshotStorageDetail["growth"] = {};
  STORAGE_GROWTH_OBJECTS.forEach((object, i) => {
    const rows = growthRows[i];
    if (!rows) return;
    const byCreator = rows.filter((r) => r.u).sort((a, b) => b.c - a.c);
    growth[object] = {
      created: rows.reduce((a, r) => a + r.c, 0),
      topCreators: byCreator.slice(0, 3).map((r) => ({ userId: r.u!, count: r.c })),
    };
  });

  const nothing = Object.keys(oldActivities).length === 0 && emails === null && campaignMembers === null && Object.keys(growth).length === 0;
  if (nothing) return null;
  return {
    oldActivities,
    oldActivityYears: w.oldActivityYears,
    emails,
    oldCampaignMembers: campaignMembers,
    oldCampaignYears: w.oldCampaignYears,
    growth,
    growthWindowDays: w.growthWindowDays,
  };
}

/** Page views per user from the Lightning Usage data: counts only, never what was on a page. */
async function collectPageUsage(client: SalesforceClient): Promise<SnapshotPageUsage> {
  const [all, sales, cases, mobile, monthly] = await Promise.all([
    client.query<{ u: string; c: number }>(QUERIES.pageViews),
    client.query<{ u: string; c: number }>(QUERIES.salesPageViews),
    client.query<{ u: string; c: number }>(QUERIES.casePageViews),
    client.query<{ u: string }>(QUERIES.mobileUsers),
    client.query<{ y: number; m: number; l: string | null; c: number }>(QUERIES.monthlyActiveUsers),
  ]);
  const byId = (rows: { u: string; c: number }[]) => Object.fromEntries(rows.filter((r) => r.u).map((r) => [r.u, r.c]));
  const salesOrCases = new Set([...Object.keys(byId(sales)), ...Object.keys(byId(cases))]);
  const candidates = Object.keys(byId(all)).filter((id) => !salesOrCases.has(id));
  return {
    windowDays: PAGE_WINDOW_DAYS,
    byUser: byId(all),
    salesByUser: byId(sales),
    casesByUser: byId(cases),
    mobileUserIds: mobile.map((r) => r.u).filter(Boolean),
    customObjectsByUser: await customObjectsByUser(client, candidates).catch(() => null),
    monthlyActive: monthly
      .filter((r) => r.l)
      .map((r) => ({ month: `${r.y}-${String(r.m).padStart(2, "0")}`, license: r.l!, users: r.c })),
  };
}

/** Users per query: aggregate queries stop at 2,000 rows, and one user rarely opens more than ~50 custom object pages. */
const CUSTOM_OBJECT_BATCH = 20;

/** How many distinct custom objects each user opened, for the Platform Starter limit. */
async function customObjectsByUser(client: SalesforceClient, userIds: string[]): Promise<Record<string, number>> {
  const objects = new Map<string, Set<string>>();
  for (let i = 0; i < userIds.length; i += CUSTOM_OBJECT_BATCH) {
    const rows = await client.query<{ u: string; p: string | null }>(customObjectPagesQuery(userIds.slice(i, i + CUSTOM_OBJECT_BATCH)));
    for (const r of rows) {
      const object = r.p?.split(" ")[0];
      if (!r.u || !object?.endsWith("__c")) continue;
      const set = objects.get(r.u) ?? new Set<string>();
      set.add(object);
      objects.set(r.u, set);
    }
  }
  return Object.fromEntries([...objects].map(([u, set]) => [u, set.size]));
}

/** When each recently deactivated user was deactivated and when they last logged in. */
async function collectDeactivations(client: SalesforceClient): Promise<SnapshotDeactivation[]> {
  const rows = await client.query<{ Display: string | null; CreatedDate: string }>(QUERIES.deactivations);
  // The audit text reads "Deactivated user Jane Doe (UserID: [005...])". Only the Id is taken from it.
  const dates = new Map<string, string>();
  for (const r of rows) {
    const id = r.Display?.match(/\[(005[A-Za-z0-9]{12,15})\]/)?.[1]?.slice(0, 15);
    if (id && (!dates.has(id) || r.CreatedDate > dates.get(id)!)) dates.set(id, r.CreatedDate);
  }
  if (dates.size === 0) return [];
  const users = await client.query<{ Id: string; LastLoginDate: string | null; Profile: { UserLicense: { Name: string } | null } | null }>(
    deactivatedUsersQuery([...dates.keys()].slice(0, 200)),
  );
  return users.flatMap((u) => {
    const deactivatedAt = dates.get(u.Id.slice(0, 15));
    return deactivatedAt
      ? [{ deactivatedAt, lastLoginDate: u.LastLoginDate, licenseName: u.Profile?.UserLicense?.Name ?? null }]
      : [];
  });
}

/** Reads the org's own Salesforce contracts and invoices, the data behind the Your Account app. */
async function collectSalesforceAccount(client: SalesforceClient): Promise<SnapshotSalesforceAccount> {
  const [contracts, invoices] = await Promise.all([
    client.query<{
      Id: string;
      ContractNumber: string | null;
      StartDate: string | null;
      EndDate: string | null;
      SalesforceContractStatus: string | null;
      AutoRenewCode: string | null;
      BillingFrequency: string | null;
      ContractCurrency: string | null;
    }>(QUERIES.salesforceContracts),
    client.query<{ SalesforceContractId: string | null; InvoiceDate: string | null; TotalAmount: number | null; InvoiceCurrency: string | null }>(
      QUERIES.salesforceInvoices,
    ),
  ]);
  return {
    contracts: contracts.map((c) => ({
      id: c.Id,
      number: c.ContractNumber,
      startDate: c.StartDate,
      endDate: c.EndDate,
      status: c.SalesforceContractStatus,
      autoRenew: c.AutoRenewCode === "Yes" ? true : c.AutoRenewCode === "No" ? false : null,
      billingFrequency: c.BillingFrequency,
      currency: c.ContractCurrency,
    })),
    invoices: invoices.map((i) => ({
      contractId: i.SalesforceContractId,
      date: i.InvoiceDate,
      total: i.TotalAmount ?? 0,
      currency: i.InvoiceCurrency,
    })),
  };
}

/** Counts records each user created or last edited recently. Objects that fail are skipped with a warning. */
async function collectWriteActivity(client: SalesforceClient, warnings: string[]): Promise<SnapshotWriteActivity | null> {
  const byUser: Record<string, number> = {};
  const byObject: Record<string, Record<string, number>> = {};
  const objects: string[] = [];
  const failed: string[] = [];
  await Promise.all(
    ACTIVITY_OBJECTS.map(async (object) => {
      try {
        const [created, modified] = await Promise.all([
          client.query<{ u: string; c: number }>(activityQuery(object, "CreatedById")),
          client.query<{ u: string; c: number }>(activityQuery(object, "LastModifiedById")),
        ]);
        const counts: Record<string, number> = {};
        for (const r of [...created, ...modified]) {
          if (!r.u) continue;
          byUser[r.u] = (byUser[r.u] ?? 0) + r.c;
          counts[r.u] = (counts[r.u] ?? 0) + r.c;
        }
        byObject[object] = counts;
        objects.push(object);
      } catch (e) {
        if (e instanceof SalesforceAuthError) throw e;
        failed.push(object);
      }
    }),
  );
  if (failed.length) warnings.push(`User activity: couldn't read ${failed.join(", ")}`);
  if (objects.length === 0) return null;
  return { objects: ACTIVITY_OBJECTS.filter((o) => objects.includes(o)), byUser, byObject, windowDays: ACTIVITY_WINDOW_DAYS };
}

/**
 * Lists installed managed packages and, for each of their custom objects, when a record
 * was last created or edited. A package whose objects have gone quiet is probably unused.
 */
async function collectInstalledPackages(client: SalesforceClient): Promise<SnapshotInstalledPackage[]> {
  const installed = await client.query<{ SubscriberPackage: { NamespacePrefix: string | null; Name: string } | null }>(
    QUERIES.installedPackages,
    { tooling: true },
  );
  let budget = MAX_PACKAGE_OBJECTS;
  const packages: SnapshotInstalledPackage[] = [];
  for (const row of installed) {
    const pkg = row.SubscriberPackage;
    if (!pkg) continue;
    const entry: SnapshotInstalledPackage = { namespace: pkg.NamespacePrefix, name: pkg.Name, objects: [], truncated: false };
    packages.push(entry);
    if (!pkg.NamespacePrefix) continue;
    let defs: { QualifiedApiName: string; Label: string }[] = [];
    try {
      defs = await client.query<{ QualifiedApiName: string; Label: string }>(packageObjectsQuery(pkg.NamespacePrefix));
    } catch (e) {
      if (e instanceof SalesforceAuthError) throw e;
    }
    // Custom objects only: settings (__mdt), events (__e) and the like don't hold business records.
    const custom = defs.filter((d) => d.QualifiedApiName.endsWith("__c"));
    const take = Math.min(custom.length, MAX_OBJECTS_PER_PACKAGE, budget);
    budget -= take;
    entry.truncated = take < custom.length;
    entry.objects = await Promise.all(
      custom.slice(0, take).map(async (d) => {
        try {
          const [r] = await client.query<{ c: string | null; m: string | null }>(lastActivityQuery(d.QualifiedApiName));
          return { apiName: d.QualifiedApiName, label: d.Label, lastCreated: r?.c ?? null, lastModified: r?.m ?? null, unreadable: false };
        } catch (e) {
          if (e instanceof SalesforceAuthError) throw e;
          return { apiName: d.QualifiedApiName, label: d.Label, lastCreated: null, lastModified: null, unreadable: true };
        }
      }),
    );
  }
  return packages;
}

/** `Invoice__c` counts; `ns__Invoice__c` (a package's), `Setting__mdt` and `Change__e` don't. */
export function isOwnCustomObject(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]*__c$/.test(name) && name.split("__").length === 2;
}

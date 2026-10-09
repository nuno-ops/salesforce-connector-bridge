import { SF_API_VERSION, SalesforceAuthError, type SalesforceClient } from "./client";
import type { OrgSnapshot, SnapshotInstalledPackage, SnapshotWriteActivity } from "./types";

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
interface MonthAggregate {
  y: number;
  m: number;
  c: number;
  a?: number | null;
}
interface Limits {
  DataStorageMB?: { Max: number; Remaining: number };
  FileStorageMB?: { Max: number; Remaining: number };
}

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
  leadsByMonth:
    "SELECT CALENDAR_YEAR(CreatedDate) y, CALENDAR_MONTH(CreatedDate) m, COUNT(Id) c FROM Lead WHERE CreatedDate = LAST_N_DAYS:180 GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)",
  opportunitiesByMonth:
    "SELECT CALENDAR_YEAR(CreatedDate) y, CALENDAR_MONTH(CreatedDate) m, COUNT(Id) c FROM Opportunity WHERE CreatedDate = LAST_N_DAYS:180 GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)",
  wonByMonth:
    "SELECT CALENDAR_YEAR(CloseDate) y, CALENDAR_MONTH(CloseDate) m, COUNT(Id) c, SUM(Amount) a FROM Opportunity WHERE IsWon = true AND CloseDate = LAST_N_DAYS:180 GROUP BY CALENDAR_YEAR(CloseDate), CALENDAR_MONTH(CloseDate)",
  installedPackages:
    "SELECT SubscriberPackage.NamespacePrefix, SubscriberPackage.Name FROM InstalledSubscriberPackage",
} as const;

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

  const [org, users, userLicenses, objectPermissions, assignments, tokens, packages, psLicenses, limits, sandboxes, leads, opps, won, writeActivity, installedPackages] =
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
      optional("Lead trend", () => client.query<MonthAggregate>(QUERIES.leadsByMonth), []),
      optional("Opportunity trend", () => client.query<MonthAggregate>(QUERIES.opportunitiesByMonth), []),
      optional("Closed-won trend", () => client.query<MonthAggregate>(QUERIES.wonByMonth), []),
      collectWriteActivity(client, warnings),
      optional("Installed apps", () => collectInstalledPackages(client), null),
    ]);

  const organization = org[0];
  if (!organization) throw new Error("Couldn't read the Organization record.");

  const month = (r: MonthAggregate) => `${r.y}-${String(r.m).padStart(2, "0")}`;
  const wonByMonth = new Map(won.map((r) => [month(r), r]));
  const oppMonths = new Set([...opps.map(month), ...wonByMonth.keys()]);

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
    sandboxes: sandboxes?.map((s) => ({ name: s.SandboxName, licenseType: s.LicenseType, description: s.Description })) ?? null,
    writeActivity,
    installedPackages,
    metrics: {
      leadsByMonth: leads.map((r) => ({ month: month(r), count: r.c })).sort((a, b) => a.month.localeCompare(b.month)),
      opportunitiesByMonth: [...oppMonths].sort().map((m) => {
        const created = opps.find((r) => month(r) === m);
        const w = wonByMonth.get(m);
        return { month: m, count: created?.c ?? 0, won: w?.c ?? 0, wonAmount: w?.a ?? 0 };
      }),
    },
    warnings,
  };
}

/** Counts records each user created or last edited recently. Objects that fail are skipped with a warning. */
async function collectWriteActivity(client: SalesforceClient, warnings: string[]): Promise<SnapshotWriteActivity | null> {
  const byUser: Record<string, number> = {};
  const objects: string[] = [];
  const failed: string[] = [];
  await Promise.all(
    ACTIVITY_OBJECTS.map(async (object) => {
      try {
        const [created, modified] = await Promise.all([
          client.query<{ u: string; c: number }>(activityQuery(object, "CreatedById")),
          client.query<{ u: string; c: number }>(activityQuery(object, "LastModifiedById")),
        ]);
        for (const r of [...created, ...modified]) if (r.u) byUser[r.u] = (byUser[r.u] ?? 0) + r.c;
        objects.push(object);
      } catch (e) {
        if (e instanceof SalesforceAuthError) throw e;
        failed.push(object);
      }
    }),
  );
  if (failed.length) warnings.push(`User activity: couldn't read ${failed.join(", ")}`);
  if (objects.length === 0) return null;
  return { objects: ACTIVITY_OBJECTS.filter((o) => objects.includes(o)), byUser, windowDays: ACTIVITY_WINDOW_DAYS };
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

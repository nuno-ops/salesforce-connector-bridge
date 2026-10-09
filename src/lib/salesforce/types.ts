/**
 * Normalised, point-in-time copy of everything a scan reads from a Salesforce org.
 * Stored as JSON on the scan row so results can be recomputed (for example after
 * the customer edits their prices) without calling Salesforce again.
 */
export interface OrgSnapshot {
  version: 1;
  capturedAt: string;
  organization: {
    id: string;
    name: string;
    /** Salesforce `Organization.OrganizationType`, e.g. "Enterprise Edition". */
    edition: string;
    isSandbox: boolean;
    instanceUrl: string;
  };
  users: SnapshotUser[];
  /** Object permissions on Opportunity, Lead and Case only. */
  objectPermissions: SnapshotObjectPermission[];
  permissionSetAssignments: { assigneeId: string; permissionSetId: string }[];
  oauthTokens: SnapshotOauthToken[];
  userLicenses: SnapshotLicense[];
  packageLicenses: SnapshotPackageLicense[];
  permissionSetLicenses: SnapshotLicense[];
  storage: SnapshotStorage | null;
  /** `null` when the Tooling API was not readable for the connected user. */
  sandboxes: SnapshotSandbox[] | null;
  /**
   * Records each user created or edited in the last 90 days across core objects.
   * Missing on snapshots taken before this was collected; `null` when no object was readable.
   */
  writeActivity?: SnapshotWriteActivity | null;
  /** Installed managed packages and when their objects last saw a record. Missing on older snapshots; `null` when unreadable. */
  installedPackages?: SnapshotInstalledPackage[] | null;
  metrics: {
    leadsByMonth: { month: string; count: number }[];
    opportunitiesByMonth: { month: string; count: number; won: number; wonAmount: number }[];
  };
  /** Non-fatal problems, e.g. a query the connected user lacks permission for. */
  warnings: string[];
}

export interface SnapshotUser {
  id: string;
  name: string;
  username: string;
  email: string | null;
  userType: string;
  profileId: string | null;
  profileName: string | null;
  licenseName: string | null;
  lastLoginDate: string | null;
  createdDate: string | null;
}

export interface SnapshotObjectPermission {
  /** Permission set Id (profiles have a backing permission set too). */
  parentId: string;
  /** Set when the permission set is the one owned by a profile. */
  profileId: string | null;
  sobjectType: string;
  read: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface SnapshotOauthToken {
  id: string;
  appName: string;
  userId: string;
  useCount: number;
  lastUsedDate: string | null;
}

export interface SnapshotLicense {
  id: string;
  name: string;
  total: number;
  used: number;
}

export interface SnapshotPackageLicense {
  id: string;
  namespace: string;
  status: string;
  allowed: number;
  used: number;
}

export interface SnapshotStorage {
  dataMaxMB: number;
  dataRemainingMB: number;
  fileMaxMB: number;
  fileRemainingMB: number;
}

export interface SnapshotSandbox {
  name: string;
  licenseType: string;
  description: string | null;
}

export interface SnapshotWriteActivity {
  /** Objects whose counts are included; objects that failed to query are left out. */
  objects: string[];
  /** User Id → records created plus records last edited by that user in the window. */
  byUser: Record<string, number>;
  windowDays: number;
}

export interface SnapshotInstalledPackage {
  namespace: string | null;
  name: string;
  objects: SnapshotPackageObject[];
  /** The package has more custom objects than we checked. */
  truncated: boolean;
}

export interface SnapshotPackageObject {
  apiName: string;
  label: string;
  /** Latest CreatedDate / LastModifiedDate on any record; `null` when the object is empty. */
  lastCreated: string | null;
  lastModified: string | null;
  /** The object couldn't be queried (no access or the query timed out). */
  unreadable: boolean;
}

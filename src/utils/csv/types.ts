export interface RawLicense {
  Id: string;
  Name?: string;
  TotalLicenses?: number;
  UsedLicenses?: number;
  NamespacePrefix?: string;
  DeveloperName?: string;
  AllowedLicenses?: number;
  Status?: string;
}

export interface SavingsBreakdown {
  title: string;
  amount: number;
  details: string;
  count?: number;
  potentialGBSavings?: number;
}

export interface ExportData {
  userLicenses: RawLicense[];
  packageLicenses: RawLicense[];
  permissionSetLicenses: RawLicense[];
  sandboxes: any[];
  limits: any;
  users: any[];
  standardUsers: any[];
  oauthTokens: any[];
  licensePrice: number;
  storageUsage?: number;
  savingsBreakdown: SavingsBreakdown[];
  // Savings data
  inactiveUserSavings?: number;
  inactiveUserCount?: number;
  integrationUserSavings?: number;
  integrationUserCount?: number;
  platformLicenseSavings?: number;
  platformLicenseCount?: number;
  sandboxSavings?: number;
  excessSandboxCount?: number;
  storageSavings?: number;
  potentialStorageReduction?: number;
}

export interface CSVSection {
  title: string;
  headers: string[];
  rows: string[][];
}
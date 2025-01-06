export interface RawLicense {
  Id: string;
  Name?: string;
  TotalLicenses?: number;
  UsedLicenses?: number;
  NamespacePrefix?: string;
  DeveloperName?: string;
  AllowedLicenses?: number;
  Status?: string;
  type?: 'user' | 'package' | 'permissionSet';
  // Formatted data
  name?: string;
  total?: number;
  used?: number;
}

export interface ExportData {
  userLicenses: RawLicense[];
  packageLicenses: RawLicense[];
  permissionSetLicenses: RawLicense[];
  sandboxes: any[];
  limits: any;
  licensePrice?: number;
  storageUsage?: number;
  users?: any[];
  oauthTokens?: any[];
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

export interface SavingsBreakdown {
  inactiveUserSavings: { savings: number; count: number };
  integrationUserSavings: { savings: number; count: number };
  platformLicenseSavings: { savings: number; count: number };
  sandboxSavings: { savings: number; count: number };
  storageSavings: { savings: number; potentialGBSavings: number };
  totalSavings: number;
}

export interface CsvExportData {
  licensePrice: number;
  standardUsers: number;
  savingsBreakdown: SavingsBreakdown;
}
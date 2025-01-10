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
}

export interface SavingsReportData {
  standardUsers: any[];
  licensePrice: number;
  inactiveUserSavings: number;
  integrationUserSavings: number;
  platformLicenseSavings: number;
  sandboxSavings: number;
  storageSavings: number;
  inactiveUserCount: number;
  integrationUserCount: number;
  platformLicenseCount: number;
  excessSandboxCount: number;
  potentialStorageReduction: number;
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
  inactiveUsers: any[];
  integrationUsers: any[];
  platformUsers: any[];
  savingsBreakdown: any[];
  licensePrice: number;
  inactiveUserSavings: number;
  integrationUserSavings: number;
  platformLicenseSavings: number;
  sandboxSavings: number;
  storageSavings: number;
  inactiveUserCount: number;
  integrationUserCount: number;
  platformLicenseCount: number;
  excessSandboxCount: number;
  potentialStorageReduction: number;
}

export interface CSVSection {
  title: string;
  headers: string[];
  rows: string[][];
}
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

export interface ExportData {
  userLicenses: RawLicense[];
  packageLicenses: RawLicense[];
  permissionSetLicenses: RawLicense[];
  sandboxes: any[];
  limits: any;
  users: any[];
  oauthTokens: any[];
  inactiveUsers: any[];
  integrationUsers: any[];
  platformUsers: any[];
  savingsBreakdown: any[];
  licensePrice: number;
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
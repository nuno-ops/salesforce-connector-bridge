export interface RawLicense {
  Id: string;
  Name?: string;
  TotalLicenses?: number;
  UsedLicenses?: number;
  NamespacePrefix?: string;
  Status?: string;
  IsProvisioned?: boolean;
  AllowedLicenses?: number;
  DeveloperName?: string;
  // Additional fields for formatted data
  name?: string;
  total?: number;
  used?: number;
  type?: 'user' | 'package' | 'permissionSet';
}

export interface ExportData {
  userLicenses: RawLicense[];
  packageLicenses: RawLicense[];
  permissionSetLicenses: RawLicense[];
  sandboxes: any[];
  limits: any;
  users?: any[];
  oauthTokens?: any[];
  licensePrice?: number;
  storageUsage?: number;
}

export interface CSVSection {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface CsvExportData {
  licensePrice: number;
  standardUsers: number;
  savingsBreakdown: {
    inactiveUserSavings: { savings: number; count: number };
    integrationUserSavings: { savings: number; count: number };
    platformLicenseSavings: { savings: number; count: number };
    sandboxSavings: { savings: number; count: number };
    storageSavings: { savings: number; potentialGBSavings: number };
    totalSavings: number;
  };
}
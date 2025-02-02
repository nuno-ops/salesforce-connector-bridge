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
  userLicenses: Array<{
    name: string;
    total: number;
    used: number;
    status?: string;
  }>;
  packageLicenses: Array<{
    name: string;
    total: number;
    used: number;
    status: string;
  }>;
  permissionSetLicenses: RawLicense[];
  sandboxes: any[];
  limits: any;
  standardUsers: any[];
  licensePrice: number;
  storageUsage?: number;
  savingsBreakdown: SavingsBreakdown[];
}

export interface CSVSection {
  title: string;
  headers: string[];
  rows: string[][];
}
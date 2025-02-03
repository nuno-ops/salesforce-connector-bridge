export interface RawLicense {
  Id: string;
  Name?: string;
  NamespacePrefix?: string;
  DeveloperName?: string;
  TotalLicenses?: number;
  AllowedLicenses?: number;
  UsedLicenses?: number;
  Status?: string;
  IsProvisioned?: boolean;
  attributes?: any;
}

export interface FormattedLicense {
  id: string;
  name: string;
  total: number;
  used: number;
  type: 'user' | 'package' | 'permissionSet';
  status?: string;
}

export interface SavingsBreakdown {
  title: string;
  amount: number;
  details: string;
  viewAction?: () => void;
  count?: number;
  potentialGBSavings?: number;
}

export interface CSVSection {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ExportData {
  licensePrice: number;
  standardUsers: any[];
  savingsBreakdown: SavingsBreakdown[];
  userLicenses: RawLicense[] | FormattedLicense[];
  packageLicenses: RawLicense[] | FormattedLicense[];
  permissionSetLicenses: RawLicense[] | FormattedLicense[];
  sandboxes: any[];
  limits: any;
  users: any[];
  oauthTokens: any[];
  storageUsage?: number;
}
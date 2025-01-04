export interface RawLicense {
  name: string;
  total: number;
  used: number;
  status?: string;
}

export interface FormattedLicense {
  name: string;
  total: number;
  used: number;
  available: number;
  usagePercentage: string;
  status?: string;
}

export interface ExportData {
  userLicenses: RawLicense[];
  packageLicenses: RawLicense[];
  permissionSetLicenses: RawLicense[];
  sandboxes: any[];
  limits: any;
  oauthTokens?: any[];
  users?: any[];
}

export interface CsvSection {
  title: string;
  headers: string[];
  rows: string[][];
}
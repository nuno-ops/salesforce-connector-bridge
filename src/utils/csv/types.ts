export interface FormattedLicense {
  name: string;
  total: number;
  used: number;
  available: number;
  usagePercentage: string;
  status?: string;
}

export interface ExportData {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  oauthTokens?: any[];
  users?: any[];
}

export interface SavingsData {
  amount: number;
  count: number;
  details: string;
}
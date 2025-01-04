export interface ExportData {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users?: any[];
  oauthTokens?: any[];
}

export interface FormattedLicense {
  name: string;
  total: number;
  used: number;
  available: number;
  usagePercentage: string;
  status?: string;
}
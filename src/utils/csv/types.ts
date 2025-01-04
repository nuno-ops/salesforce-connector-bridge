export interface ExportData {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users?: any[];
  oauthTokens?: any[];
}

export interface CSVSection {
  title: string;
  headers: string[];
  rows: string[][];
}
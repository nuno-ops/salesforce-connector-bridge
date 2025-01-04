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
}

export interface CSVSection {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ExportData {
  userLicenses: RawLicense[];
  packageLicenses: RawLicense[];
  permissionSetLicenses: RawLicense[];
  sandboxes: any[];
  limits: any;
  users?: any[];
  oauthTokens?: any[];
}
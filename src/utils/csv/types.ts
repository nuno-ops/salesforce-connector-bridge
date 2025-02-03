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
export interface OrgLimits {
  DataStorageMB: {
    Max: number;
    Remaining: number;
  };
  FileStorageMB: {
    Max: number;
    Remaining: number;
  };
  DailyApiRequests: {
    Max: number;
    Remaining: number;
  };
  SingleEmail: {
    Max: number;
    Remaining: number;
  };
  HourlyTimeBasedWorkflow: {
    Max: number;
    Remaining: number;
  };
}

export interface SandboxInfo {
  Id: string;
  SandboxName: string;
  LicenseType: string;
  Description: string;
}

export interface UserLicense {
  Id: string;
  Name: string;
  TotalLicenses: number;
  UsedLicenses: number;
}

export interface PackageLicense {
  Id: string;
  NamespacePrefix: string;
  Status: string;
  IsProvisioned: boolean;
  AllowedLicenses: number;
  UsedLicenses: number;
}

export interface PermissionSetLicense {
  Id: string;
  DeveloperName: string;
  TotalLicenses: number;
  UsedLicenses: number;
}

export interface LeadRecord {
  Id: string;
  IsConverted: boolean;
  CreatedDate: string;
  ConvertedDate: string | null;
  Status: string;
}

export interface OpportunityRecord {
  Id: string;
  StageName: string;
  IsClosed: boolean;
  IsWon: boolean;
  CreatedDate: string;
  CloseDate: string;
}

export interface MonthlyMetrics {
  leads: LeadRecord[];
  opportunities: OpportunityRecord[];
}

export interface LicenseInfo {
  name: string;
  total: number;
  used: number;
  id: string;
  type: 'user' | 'package' | 'permissionSet';
  status?: string;
  featureArea?: string;
}
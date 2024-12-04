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
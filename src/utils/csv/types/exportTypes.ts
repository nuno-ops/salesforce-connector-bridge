export interface SavingsBreakdown {
  inactiveUserSavings: { savings: number; count: number };
  integrationUserSavings: { savings: number; count: number };
  platformLicenseSavings: { savings: number; count: number };
  sandboxSavings: { savings: number; count: number };
  storageSavings: { savings: number; potentialGBSavings: number };
  totalSavings: number;
}

export interface CsvExportData {
  licensePrice: number;
  standardUsers: any[];
  savingsBreakdown: SavingsBreakdown;
}
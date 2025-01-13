export interface SavingsBreakdown {
  title: string;
  amount: number;
  details: string;
  viewAction?: () => void;
  count?: number;
  potentialGBSavings?: number;
}

export interface ExportData {
  licensePrice: number;
  standardUsers: any[];
  savingsBreakdown: SavingsBreakdown[];
}
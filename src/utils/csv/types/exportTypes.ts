export interface SavingsBreakdown {
  title: string;
  amount: number;
  details: string;
  viewAction?: () => void;
}

export interface ExportData {
  licensePrice: number;
  standardUsers: any[];
  savingsBreakdown: SavingsBreakdown[];
}
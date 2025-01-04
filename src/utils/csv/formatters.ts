import { FormattedLicense } from './types';

export const formatNumber = (value: number | undefined | null): number => {
  if (value === undefined || value === null) {
    console.log('formatNumber: received undefined/null value');
    return 0;
  }
  
  // Convert -1 (unlimited) to 0 for display purposes
  if (value === -1) {
    console.log('formatNumber: converting -1 to 0 for unlimited value');
    return 0;
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    console.log('formatNumber: received NaN value');
    return 0;
  }
  
  return num;
};

export const calculateUsagePercentage = (used: number, total: number): string => {
  console.log(`calculateUsagePercentage: used=${used}, total=${total}`);
  if (total === 0) return '0.0';
  return ((used / total) * 100).toFixed(1);
};

export const formatLicenseData = (license: any): FormattedLicense => {
  console.log('formatLicenseData input:', license);
  
  const total = formatNumber(license.total);
  const used = formatNumber(license.used);
  const available = total - used;
  const usagePercentage = calculateUsagePercentage(used, total);
  
  const formatted = {
    name: license.name || 'Unknown',
    total,
    used,
    available,
    usagePercentage,
    status: license.status
  };
  
  console.log('formatLicenseData output:', formatted);
  return formatted;
};

export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString()}`;
};
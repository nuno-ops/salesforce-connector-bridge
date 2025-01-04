import { FormattedLicense } from './types';

export const formatNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const calculateUsagePercentage = (used: number, total: number): string => {
  return total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';
};

export const formatLicenseData = (license: any): FormattedLicense => {
  const total = formatNumber(license.total);
  const used = formatNumber(license.used);
  const available = total - used;
  const usagePercentage = calculateUsagePercentage(used, total);
  
  return {
    name: license.name || 'Unknown',
    total,
    used,
    available,
    usagePercentage,
    status: license.status
  };
};

export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString()}`;
};
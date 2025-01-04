import { FormattedLicense } from './types';

export const formatNumber = (value: any): number => {
  console.log('Formatting number value:', value);
  
  // Handle direct number values
  if (typeof value === 'number') {
    // Convert -1 (unlimited) to 0 for display
    return value === -1 ? 0 : value;
  }
  
  // Return 0 for invalid values
  return 0;
};

export const calculateUsagePercentage = (used: number, total: number): string => {
  if (total === 0) return '0.0';
  return ((used / total) * 100).toFixed(1);
};

export const formatLicenseData = (license: any): FormattedLicense => {
  console.log('Formatting license data input:', license);
  
  // Access properties directly as they appear in the raw data
  const name = license.name || 'Unknown';
  const total = formatNumber(license.total);
  const used = formatNumber(license.used);
  const available = total - used;
  const usagePercentage = calculateUsagePercentage(used, total);
  
  const formatted: FormattedLicense = {
    name,
    total,
    used,
    available,
    usagePercentage,
    status: license.status || 'Active'
  };
  
  console.log('Formatted license data output:', formatted);
  return formatted;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
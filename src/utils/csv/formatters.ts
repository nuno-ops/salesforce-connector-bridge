import { FormattedLicense } from './types';

export const formatNumber = (value: any): number => {
  // Handle Salesforce specific fields
  if (typeof value === 'object') {
    if ('TotalLicenses' in value) return Number(value.TotalLicenses) || 0;
    if ('AllowedLicenses' in value) return Number(value.AllowedLicenses) || 0;
    if ('UsedLicenses' in value) return Number(value.UsedLicenses) || 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const calculateUsagePercentage = (used: number, total: number): string => {
  if (total === 0) return '0.0';
  return ((used / total) * 100).toFixed(1);
};

export const formatLicenseData = (license: any): FormattedLicense => {
  // Handle different license types
  const total = formatNumber(license.TotalLicenses || license.AllowedLicenses);
  const used = formatNumber(license.UsedLicenses);
  const available = total - used;
  const usagePercentage = calculateUsagePercentage(used, total);
  
  return {
    name: license.Name || license.NamespacePrefix || license.DeveloperName || 'Unknown',
    total,
    used,
    available,
    usagePercentage,
    status: license.Status || 'Active'
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};
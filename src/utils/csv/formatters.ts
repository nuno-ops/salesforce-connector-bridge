import { FormattedLicense } from './types';

export const formatNumber = (value: any): number => {
  console.log('Formatting number value:', value);
  
  // Handle Salesforce specific fields
  if (typeof value === 'object') {
    console.log('Value is an object:', value);
    if ('TotalLicenses' in value) return Number(value.TotalLicenses) || 0;
    if ('AllowedLicenses' in value) return Number(value.AllowedLicenses) || 0;
    if ('UsedLicenses' in value) return Number(value.UsedLicenses) || 0;
  }
  
  // Handle unlimited licenses (-1)
  if (value === -1) return 0;
  
  const num = Number(value);
  console.log('Converted number:', num);
  return isNaN(num) ? 0 : num;
};

export const calculateUsagePercentage = (used: number, total: number): string => {
  if (total === 0) return '0.0';
  return ((used / total) * 100).toFixed(1);
};

export const formatLicenseData = (license: any): FormattedLicense => {
  console.log('Formatting license data input:', license);
  
  // Handle different license data structures
  const name = license.Name || license.name || license.LicenseDefinitionKey || 'Unknown';
  console.log('License name:', name);
  
  // Get total licenses - check different possible fields
  const total = formatNumber(license.TotalLicenses || license.total || license.AllowedLicenses || 0);
  console.log('Total licenses:', total);
  
  // Get used licenses - check different possible fields
  const used = formatNumber(license.UsedLicenses || license.used || 0);
  console.log('Used licenses:', used);
  
  // Calculate available licenses
  const available = total - used;
  console.log('Available licenses:', available);
  
  // Calculate usage percentage
  const usagePercentage = calculateUsagePercentage(used, total);
  console.log('Usage percentage:', usagePercentage);
  
  const formatted: FormattedLicense = {
    name,
    total,
    used,
    available,
    usagePercentage,
    status: license.Status || license.status || 'Active'
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
import { FormattedLicense } from './types';

export const formatNumber = (value: any): number => {
  console.log('formatNumber input:', value, 'type:', typeof value);
  
  // Handle direct number values
  if (typeof value === 'number') {
    const result = value === -1 ? 0 : value;
    console.log('formatNumber output:', result);
    return result;
  }
  
  // Try to parse string numbers
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      console.log('formatNumber parsed string:', parsed);
      return parsed;
    }
  }
  
  console.log('formatNumber returning 0 for invalid input');
  return 0;
};

export const calculateUsagePercentage = (used: number, total: number): string => {
  console.log('calculateUsagePercentage inputs:', { used, total });
  if (total === 0) return '0.0';
  const percentage = ((used / total) * 100).toFixed(1);
  console.log('calculateUsagePercentage output:', percentage);
  return percentage;
};

export const formatLicenseData = (license: any): FormattedLicense => {
  console.log('formatLicenseData raw input:', JSON.stringify(license, null, 2));
  
  // Log all available properties
  console.log('License properties:', Object.keys(license));
  
  // Access properties directly as they appear in the raw data
  const name = license.name;
  console.log('Extracted name:', name);
  
  const total = formatNumber(license.total);
  console.log('Extracted total:', total);
  
  const used = formatNumber(license.used);
  console.log('Extracted used:', used);
  
  const available = total - used;
  console.log('Calculated available:', available);
  
  const usagePercentage = calculateUsagePercentage(used, total);
  console.log('Calculated usagePercentage:', usagePercentage);
  
  const status = license.status || 'Active';
  console.log('Extracted status:', status);
  
  const formatted: FormattedLicense = {
    name: name || 'Unknown',
    total,
    used,
    available,
    usagePercentage,
    status
  };
  
  console.log('formatLicenseData final output:', JSON.stringify(formatted, null, 2));
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
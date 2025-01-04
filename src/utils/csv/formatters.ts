import { FormattedLicense, RawLicense } from './types';

export const formatNumber = (value: number | undefined | null): number => {
  console.log('formatNumber input:', value);
  
  if (value === undefined || value === null) {
    return 0;
  }
  
  // Convert -1 (unlimited) to 0 for display purposes
  if (value === -1) {
    return 0;
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return 0;
  }
  
  return num;
};

export const calculateUsagePercentage = (used: number, total: number): string => {
  console.log(`calculateUsagePercentage: used=${used}, total=${total}`);
  if (total === 0 || total === -1) return '0.0';
  return ((used / total) * 100).toFixed(1);
};

export const formatLicenseData = (license: RawLicense): FormattedLicense => {
  console.log('formatLicenseData input:', license);
  
  // Ensure we have the basic required fields
  if (!license) {
    console.error('License data is undefined or null');
    return {
      name: 'Unknown',
      total: 0,
      used: 0,
      available: 0,
      usagePercentage: '0.0',
      status: 'Unknown'
    };
  }

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
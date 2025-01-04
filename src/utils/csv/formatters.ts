import { RawLicense } from './types';

export const formatNumber = (value: number | undefined | null): number => {
  if (value === undefined || value === null) {
    return 0;
  }
  
  if (value === -1) {
    return 0;
  }
  
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const calculateUsagePercentage = (used: number, total: number): string => {
  if (total === 0 || total === -1) return '0.0';
  return ((used / total) * 100).toFixed(1);
};

export const getLicenseName = (license: RawLicense): string => {
  return license.Name || 
         license.NamespacePrefix || 
         license.DeveloperName || 
         'Unknown';
};

export const getLicenseTotal = (license: RawLicense): number => {
  return license.TotalLicenses || 
         license.AllowedLicenses || 
         0;
};

export const getLicenseUsed = (license: RawLicense): number => {
  return license.UsedLicenses || 0;
};

export const getLicenseStatus = (license: RawLicense): string => {
  return license.Status || 'Active';
};
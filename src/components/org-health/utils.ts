import { LicenseInfo } from './types';

export const formatLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatLicenseData input:', licenses);
  
  if (!Array.isArray(licenses)) {
    console.warn('formatLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => ({
    name: license.Name || '',
    total: license.TotalLicenses,
    used: license.UsedLicenses,
    id: license.Id,
    type: 'user' as const
  }));

  console.log('formatLicenseData output:', formatted);
  return formatted;
};

export const formatPackageLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPackageLicenseData input:', licenses);
  
  if (!Array.isArray(licenses)) {
    console.warn('formatPackageLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => ({
    name: license.NamespacePrefix || '',
    total: license.AllowedLicenses,
    used: license.UsedLicenses,
    status: license.Status,
    id: license.Id,
    type: 'package' as const
  }));

  console.log('formatPackageLicenseData output:', formatted);
  return formatted;
};

export const formatPermissionSetLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPermissionSetLicenseData input:', licenses);
  
  if (!Array.isArray(licenses)) {
    console.warn('formatPermissionSetLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => ({
    name: license.DeveloperName || '',
    total: license.TotalLicenses,
    used: license.UsedLicenses,
    id: license.Id,
    type: 'permissionSet' as const
  }));

  console.log('formatPermissionSetLicenseData output:', formatted);
  return formatted;
};
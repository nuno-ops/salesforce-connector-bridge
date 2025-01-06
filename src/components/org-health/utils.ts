import { LicenseInfo } from './types';

export const formatLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatLicenseData input:', {
    count: licenses?.length,
    firstLicense: licenses?.[0]
  });
  
  if (!Array.isArray(licenses)) {
    console.warn('formatLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => ({
    name: license?.Name || '',
    total: Number(license?.TotalLicenses) || 0,
    used: Number(license?.UsedLicenses) || 0,
    id: license?.Id,
    type: 'user' as const
  }));

  console.log('formatLicenseData output:', {
    count: formatted.length,
    firstFormatted: formatted[0]
  });
  return formatted;
};

export const formatPackageLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPackageLicenseData input:', {
    count: licenses?.length,
    firstLicense: licenses?.[0]
  });

  if (!Array.isArray(licenses)) {
    console.warn('formatPackageLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => ({
    name: license?.NamespacePrefix || '',
    total: Number(license?.AllowedLicenses) || 0,
    used: Number(license?.UsedLicenses) || 0,
    status: license?.Status,
    id: license?.Id,
    type: 'package' as const
  }));

  console.log('formatPackageLicenseData output:', {
    count: formatted.length,
    firstFormatted: formatted[0]
  });
  return formatted;
};

export const formatPermissionSetLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPermissionSetLicenseData input:', {
    count: licenses?.length,
    firstLicense: licenses?.[0]
  });

  if (!Array.isArray(licenses)) {
    console.warn('formatPermissionSetLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => ({
    name: license?.DeveloperName || '',
    total: Number(license?.TotalLicenses) || 0,
    used: Number(license?.UsedLicenses) || 0,
    id: license?.Id,
    type: 'permissionSet' as const
  }));

  console.log('formatPermissionSetLicenseData output:', {
    count: formatted.length,
    firstFormatted: formatted[0]
  });
  return formatted;
};
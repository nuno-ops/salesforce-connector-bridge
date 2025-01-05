import { LicenseInfo } from './types';

export const formatLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatLicenseData input:', {
    rawData: licenses?.[0],
    properties: licenses?.[0] ? Object.keys(licenses[0]) : []
  });
  
  if (!Array.isArray(licenses)) {
    console.warn('formatLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    const formattedLicense: LicenseInfo = {
      name: license?.Name || '',
      total: Number(license?.TotalLicenses) || 0,
      used: Number(license?.UsedLicenses) || 0,
      id: license?.Id,
      type: 'user' as const
    };

    return formattedLicense;
  });

  console.log('formatLicenseData output:', formatted?.[0]);
  return formatted;
};

export const formatPackageLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPackageLicenseData input:', {
    rawData: licenses?.[0],
    properties: licenses?.[0] ? Object.keys(licenses[0]) : []
  });

  if (!Array.isArray(licenses)) {
    console.warn('formatPackageLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    const formattedLicense: LicenseInfo = {
      name: license?.NamespacePrefix || '',
      total: Number(license?.AllowedLicenses) || 0,
      used: Number(license?.UsedLicenses) || 0,
      status: license?.Status,
      id: license?.Id,
      type: 'package' as const
    };

    return formattedLicense;
  });

  console.log('formatPackageLicenseData output:', formatted?.[0]);
  return formatted;
};

export const formatPermissionSetLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPermissionSetLicenseData input:', {
    rawData: licenses?.[0],
    properties: licenses?.[0] ? Object.keys(licenses[0]) : []
  });

  if (!Array.isArray(licenses)) {
    console.warn('formatPermissionSetLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    const formattedLicense: LicenseInfo = {
      name: license?.DeveloperName || '',
      total: Number(license?.TotalLicenses) || 0,
      used: Number(license?.UsedLicenses) || 0,
      id: license?.Id,
      type: 'permissionSet' as const
    };

    return formattedLicense;
  });

  console.log('formatPermissionSetLicenseData output:', formatted?.[0]);
  return formatted;
};
import { LicenseInfo } from './types';

export const formatLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatLicenseData - Input:', {
    count: licenses?.length,
    firstLicense: licenses?.[0],
    allProperties: licenses?.[0] ? Object.keys(licenses[0]) : [],
    allValues: licenses?.[0] ? Object.values(licenses[0]) : [],
    timestamp: new Date().toISOString()
  });
  
  if (!Array.isArray(licenses)) {
    console.warn('formatLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    console.log('formatLicenseData - Processing license:', {
      raw: license,
      name: license?.Name,
      total: license?.TotalLicenses,
      used: license?.UsedLicenses,
      id: license?.Id
    });

    return {
      name: license?.Name || '',
      total: Number(license?.TotalLicenses) || 0,
      used: Number(license?.UsedLicenses) || 0,
      id: license?.Id,
      type: 'user' as const
    };
  });

  console.log('formatLicenseData - Output:', {
    count: formatted.length,
    firstFormatted: formatted[0],
    timestamp: new Date().toISOString()
  });
  return formatted;
};

export const formatPackageLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPackageLicenseData - Input:', {
    count: licenses?.length,
    firstLicense: licenses?.[0],
    allProperties: licenses?.[0] ? Object.keys(licenses[0]) : [],
    allValues: licenses?.[0] ? Object.values(licenses[0]) : [],
    timestamp: new Date().toISOString()
  });

  if (!Array.isArray(licenses)) {
    console.warn('formatPackageLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    console.log('formatPackageLicenseData - Processing license:', {
      raw: license,
      name: license?.NamespacePrefix,
      total: license?.AllowedLicenses,
      used: license?.UsedLicenses,
      status: license?.Status,
      id: license?.Id
    });

    return {
      name: license?.NamespacePrefix || '',
      total: Number(license?.AllowedLicenses) || 0,
      used: Number(license?.UsedLicenses) || 0,
      status: license?.Status,
      id: license?.Id,
      type: 'package' as const
    };
  });

  console.log('formatPackageLicenseData - Output:', {
    count: formatted.length,
    firstFormatted: formatted[0],
    timestamp: new Date().toISOString()
  });
  return formatted;
};

export const formatPermissionSetLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPermissionSetLicenseData - Input:', {
    count: licenses?.length,
    firstLicense: licenses?.[0],
    allProperties: licenses?.[0] ? Object.keys(licenses[0]) : [],
    allValues: licenses?.[0] ? Object.values(licenses[0]) : [],
    timestamp: new Date().toISOString()
  });

  if (!Array.isArray(licenses)) {
    console.warn('formatPermissionSetLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    console.log('formatPermissionSetLicenseData - Processing license:', {
      raw: license,
      name: license?.DeveloperName,
      total: license?.TotalLicenses,
      used: license?.UsedLicenses,
      id: license?.Id
    });

    return {
      name: license?.DeveloperName || '',
      total: Number(license?.TotalLicenses) || 0,
      used: Number(license?.UsedLicenses) || 0,
      id: license?.Id,
      type: 'permissionSet' as const
    };
  });

  console.log('formatPermissionSetLicenseData - Output:', {
    count: formatted.length,
    firstFormatted: formatted[0],
    timestamp: new Date().toISOString()
  });
  return formatted;
};
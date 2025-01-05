import { LicenseInfo } from './types';

export const formatLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatLicenseData input:', {
    rawData: licenses,
    firstItem: licenses?.[0],
    allProperties: licenses?.[0] ? Object.keys(licenses[0]) : [],
    totalItems: licenses?.length
  });
  
  if (!Array.isArray(licenses)) {
    console.warn('formatLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    console.log('Formatting user license:', {
      rawName: license?.Name,
      rawTotal: license?.TotalLicenses,
      rawUsed: license?.UsedLicenses,
      rawId: license?.Id,
      allAvailableProps: Object.keys(license || {})
    });
    
    const formattedLicense: LicenseInfo = {
      name: license?.Name || '',
      total: Number(license?.TotalLicenses) || 0,
      used: Number(license?.UsedLicenses) || 0,
      id: license?.Id,
      type: 'user' as const
    };

    console.log('Formatted user license:', formattedLicense);
    return formattedLicense;
  });

  console.log('formatLicenseData output:', {
    firstFormatted: formatted[0],
    totalFormatted: formatted.length,
    sample: formatted.slice(0, 2)
  });
  
  return formatted;
};

export const formatPackageLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPackageLicenseData input:', {
    rawData: licenses,
    firstItem: licenses?.[0],
    allProperties: licenses?.[0] ? Object.keys(licenses[0]) : [],
    totalItems: licenses?.length
  });

  if (!Array.isArray(licenses)) {
    console.warn('formatPackageLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    console.log('Formatting package license:', {
      rawName: license?.NamespacePrefix,
      rawTotal: license?.AllowedLicenses,
      rawUsed: license?.UsedLicenses,
      rawStatus: license?.Status,
      rawId: license?.Id,
      allAvailableProps: Object.keys(license || {})
    });

    const formattedLicense: LicenseInfo = {
      name: license?.NamespacePrefix || '',
      total: Number(license?.AllowedLicenses) || 0,
      used: Number(license?.UsedLicenses) || 0,
      status: license?.Status,
      id: license?.Id,
      type: 'package' as const
    };

    console.log('Formatted package license:', formattedLicense);
    return formattedLicense;
  });

  console.log('formatPackageLicenseData output:', {
    firstFormatted: formatted[0],
    totalFormatted: formatted.length,
    sample: formatted.slice(0, 2)
  });

  return formatted;
};

export const formatPermissionSetLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPermissionSetLicenseData input:', {
    rawData: licenses,
    firstItem: licenses?.[0],
    allProperties: licenses?.[0] ? Object.keys(licenses[0]) : [],
    totalItems: licenses?.length
  });

  if (!Array.isArray(licenses)) {
    console.warn('formatPermissionSetLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    console.log('Formatting permission set license:', {
      rawName: license?.DeveloperName,
      rawTotal: license?.TotalLicenses,
      rawUsed: license?.UsedLicenses,
      rawId: license?.Id,
      allAvailableProps: Object.keys(license || {})
    });

    const formattedLicense: LicenseInfo = {
      name: license?.DeveloperName || '',
      total: Number(license?.TotalLicenses) || 0,
      used: Number(license?.UsedLicenses) || 0,
      id: license?.Id,
      type: 'permissionSet' as const
    };

    console.log('Formatted permission set license:', formattedLicense);
    return formattedLicense;
  });

  console.log('formatPermissionSetLicenseData output:', {
    firstFormatted: formatted[0],
    totalFormatted: formatted.length,
    sample: formatted.slice(0, 2)
  });

  return formatted;
};
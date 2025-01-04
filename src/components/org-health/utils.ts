import { LicenseInfo } from './types';

export const formatLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatLicenseData input raw:', licenses[0]);
  
  if (!Array.isArray(licenses)) {
    console.warn('formatLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    console.log('Formatting user license:', {
      rawName: license.Name,
      rawTotal: license.TotalLicenses,
      rawUsed: license.UsedLicenses,
      rawId: license.Id
    });
    
    return {
      name: license.Name || '',
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      id: license.Id,
      type: 'user' as const
    };
  });

  console.log('formatLicenseData first formatted result:', formatted[0]);
  return formatted;
};

export const formatPackageLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPackageLicenseData input raw:', licenses[0]);
  
  if (!Array.isArray(licenses)) {
    console.warn('formatPackageLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    console.log('Formatting package license:', {
      rawName: license.NamespacePrefix,
      rawTotal: license.AllowedLicenses,
      rawUsed: license.UsedLicenses,
      rawStatus: license.Status,
      rawId: license.Id
    });
    
    return {
      name: license.NamespacePrefix || '',
      total: license.AllowedLicenses,
      used: license.UsedLicenses,
      status: license.Status,
      id: license.Id,
      type: 'package' as const
    };
  });

  console.log('formatPackageLicenseData first formatted result:', formatted[0]);
  return formatted;
};

export const formatPermissionSetLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('formatPermissionSetLicenseData input raw:', licenses[0]);
  
  if (!Array.isArray(licenses)) {
    console.warn('formatPermissionSetLicenseData received non-array input:', licenses);
    return [];
  }

  const formatted = licenses.map(license => {
    console.log('Formatting permission set license:', {
      rawName: license.DeveloperName,
      rawTotal: license.TotalLicenses,
      rawUsed: license.UsedLicenses,
      rawId: license.Id
    });
    
    return {
      name: license.DeveloperName || '',
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      id: license.Id,
      type: 'permissionSet' as const
    };
  });

  console.log('formatPermissionSetLicenseData first formatted result:', formatted[0]);
  return formatted;
};
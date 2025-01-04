import { LicenseInfo } from "./types";

export const formatLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('Formatting user licenses:', licenses);
  
  return licenses.map(license => {
    const formatted = {
      name: license.Name,
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      id: license.Id,
      type: 'user'
    };
    
    console.log('Formatted user license:', formatted);
    return formatted;
  });
};

export const formatPackageLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('Formatting package licenses:', licenses);
  
  return licenses.map(license => {
    const formatted = {
      name: license.NamespacePrefix,
      total: license.AllowedLicenses === -1 ? Infinity : license.AllowedLicenses,
      used: license.UsedLicenses,
      status: license.Status,
      id: license.Id,
      type: 'package'
    };
    
    console.log('Formatted package license:', formatted);
    return formatted;
  });
};

export const formatPermissionSetLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('Formatting permission set licenses:', licenses);
  
  return licenses.map(license => {
    const formatted = {
      name: license.DeveloperName,
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      id: license.Id,
      type: 'permissionSet'
    };
    
    console.log('Formatted permission set license:', formatted);
    return formatted;
  });
};

export const groupLicensesByType = (licenses: LicenseInfo[], type: 'user' | 'package' | 'permissionSet') => {
  if (!Array.isArray(licenses)) {
    console.warn('Invalid licenses array provided to groupLicensesByType');
    return {};
  }

  if (type === 'package') {
    return licenses.reduce((acc: { [key: string]: LicenseInfo[] }, license) => {
      const status = license.status || 'Active';
      if (!acc[status]) acc[status] = [];
      acc[status].push(license);
      return acc;
    }, {});
  }
  
  if (type === 'permissionSet') {
    return licenses.reduce((acc: { [key: string]: LicenseInfo[] }, license) => {
      const area = getFeatureArea(license.name);
      if (!acc[area]) acc[area] = [];
      acc[area].push(license);
      return acc;
    }, {});
  }

  // For user licenses, group by license type
  return licenses.reduce((acc: { [key: string]: LicenseInfo[] }, license) => {
    const type = getLicenseType(license.name);
    if (!acc[type]) acc[type] = [];
    acc[type].push(license);
    return acc;
  }, {});
};

const getFeatureArea = (name: string): string => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('sales')) return 'Sales';
  if (lowercaseName.includes('service')) return 'Service';
  if (lowercaseName.includes('platform')) return 'Platform';
  if (lowercaseName.includes('marketing')) return 'Marketing';
  if (lowercaseName.includes('analytics')) return 'Analytics';
  return 'Other';
};

const getLicenseType = (name: string): string => {
  if (name.includes('Platform')) return 'Platform';
  if (name.includes('Identity')) return 'Identity';
  if (name.includes('Guest')) return 'Guest';
  return 'Full CRM';
};
import { LicenseInfo } from "../types";

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
      const area = getFeatureArea(license.name || '');
      if (!acc[area]) acc[area] = [];
      acc[area].push(license);
      return acc;
    }, {});
  }

  // For user licenses, group by license type
  return licenses.reduce((acc: { [key: string]: LicenseInfo[] }, license) => {
    const type = getLicenseType(license.name || '');
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
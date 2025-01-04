import { LicenseInfo } from "./types";

export const formatLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('Formatting user licenses - Input:', licenses);
  
  if (!Array.isArray(licenses)) {
    console.warn('Invalid licenses array provided to formatLicenseData');
    return [];
  }

  return licenses.map(license => {
    const formatted = {
      name: license.Name || 'Unknown License',
      total: license.TotalLicenses || 0,
      used: license.UsedLicenses || 0,
      id: license.Id,
      type: 'user'
    };
    
    console.log('Formatted user license:', formatted);
    return formatted;
  });
};

export const formatPackageLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('Formatting package licenses - Input:', licenses);
  
  if (!Array.isArray(licenses)) {
    console.warn('Invalid licenses array provided to formatPackageLicenseData');
    return [];
  }

  return licenses.map(license => {
    const formatted = {
      name: license.NamespacePrefix || 'Unknown Package',
      total: license.AllowedLicenses === -1 ? Infinity : (license.AllowedLicenses || 0),
      used: license.UsedLicenses || 0,
      status: license.Status || 'Unknown',
      id: license.Id,
      type: 'package'
    };
    
    console.log('Formatted package license:', formatted);
    return formatted;
  });
};

export const formatPermissionSetLicenseData = (licenses: any[]): LicenseInfo[] => {
  console.log('Formatting permission set licenses - Input:', licenses);
  
  if (!Array.isArray(licenses)) {
    console.warn('Invalid licenses array provided to formatPermissionSetLicenseData');
    return [];
  }

  return licenses.map(license => {
    const formatted = {
      name: license.DeveloperName || 'Unknown Permission Set',
      total: license.TotalLicenses || 0,
      used: license.UsedLicenses || 0,
      id: license.Id,
      type: 'permissionSet'
    };
    
    console.log('Formatted permission set license:', formatted);
    return formatted;
  });
};

export const groupLicensesByType = (licenses: LicenseInfo[], type: 'user' | 'package' | 'permissionSet') => {
  console.log('Grouping licenses by type:', { type, licenses });
  
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
  if (!name) return 'Other';
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('sales')) return 'Sales';
  if (lowercaseName.includes('service')) return 'Service';
  if (lowercaseName.includes('platform')) return 'Platform';
  if (lowercaseName.includes('marketing')) return 'Marketing';
  if (lowercaseName.includes('analytics')) return 'Analytics';
  return 'Other';
};

const getLicenseType = (name: string): string => {
  if (!name) return 'Other';
  if (name.includes('Platform')) return 'Platform';
  if (name.includes('Identity')) return 'Identity';
  if (name.includes('Guest')) return 'Guest';
  return 'Full CRM';
};
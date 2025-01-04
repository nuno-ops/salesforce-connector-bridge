import { UserLicense, PackageLicense, PermissionSetLicense } from './types';

export const formatLicenseData = (licenses: UserLicense[]) => {
  console.log('Formatting user licenses:', licenses);
  const formatted = licenses.map(license => {
    console.log('Processing license:', license);
    const result = {
      ...license,
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      name: license.Name || 'Unknown'
    };
    console.log('Formatted license:', result);
    return result;
  });
  console.log('All formatted licenses:', formatted);
  return formatted;
};

export const formatPackageLicenseData = (licenses: PackageLicense[]) => {
  console.log('Formatting package licenses:', licenses);
  const formatted = licenses.map(license => {
    console.log('Processing package license:', license);
    const result = {
      ...license,
      total: license.AllowedLicenses,
      used: license.UsedLicenses,
      name: license.NamespacePrefix || 'Unknown',
      status: license.Status
    };
    console.log('Formatted package license:', result);
    return result;
  });
  console.log('All formatted package licenses:', formatted);
  return formatted;
};

export const formatPermissionSetLicenseData = (licenses: PermissionSetLicense[]) => {
  console.log('Formatting permission set licenses:', licenses);
  const formatted = licenses.map(license => {
    console.log('Processing permission set license:', license);
    const result = {
      ...license,
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      name: license.DeveloperName || 'Unknown'
    };
    console.log('Formatted permission set license:', result);
    return result;
  });
  console.log('All formatted permission set licenses:', formatted);
  return formatted;
};
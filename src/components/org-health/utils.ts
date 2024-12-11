import { UserLicense, PackageLicense, PermissionSetLicense } from './types';

export const formatLicenseData = (licenses: UserLicense[]) => {
  return licenses.map(license => ({
    name: license.Name,
    total: license.TotalLicenses,
    used: license.UsedLicenses
  }));
};

export const formatPackageLicenseData = (licenses: PackageLicense[]) => {
  return licenses.map(license => ({
    name: license.NamespacePrefix || 'Unnamed Package',
    total: license.AllowedLicenses,
    used: license.UsedLicenses,
    status: license.Status
  }));
};

export const formatPermissionSetLicenseData = (licenses: PermissionSetLicense[]) => {
  return licenses.map(license => ({
    name: license.DeveloperName,
    total: license.TotalLicenses,
    used: license.UsedLicenses
  }));
};
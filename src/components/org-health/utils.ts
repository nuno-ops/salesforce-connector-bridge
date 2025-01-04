import { UserLicense, PackageLicense, PermissionSetLicense } from './types';

export const formatLicenseData = (licenses: UserLicense[]) => {
  return licenses.map(license => ({
    ...license,
    total: license.TotalLicenses,
    used: license.UsedLicenses,
    name: license.Name
  }));
};

export const formatPackageLicenseData = (licenses: PackageLicense[]) => {
  return licenses.map(license => ({
    ...license,
    total: license.AllowedLicenses,
    used: license.UsedLicenses,
    name: license.NamespacePrefix,
    status: license.Status
  }));
};

export const formatPermissionSetLicenseData = (licenses: PermissionSetLicense[]) => {
  return licenses.map(license => ({
    ...license,
    total: license.TotalLicenses,
    used: license.UsedLicenses,
    name: license.DeveloperName
  }));
};
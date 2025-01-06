import { OrgLimits } from "@/components/org-health/types";
import { RawLicense } from "@/utils/csv/types";

export const calculateStorageUsage = (limits: OrgLimits | null): number => {
  if (!limits || !limits.DataStorageMB || !limits.FileStorageMB) return 0;
  
  const dataMax = limits.DataStorageMB.Max || 0;
  const dataRemaining = limits.DataStorageMB.Remaining || 0;
  const fileMax = limits.FileStorageMB.Max || 0;
  const fileRemaining = limits.FileStorageMB.Remaining || 0;
  
  const totalStorage = dataMax + fileMax;
  if (totalStorage === 0) return 0;
  
  const usedStorage = totalStorage - (dataRemaining + fileRemaining);
  return (usedStorage / totalStorage) * 100;
};

export const calculateApiUsage = (limits: OrgLimits | null): number => {
  if (!limits || !limits.DailyApiRequests) return 0;
  
  const max = limits.DailyApiRequests.Max || 0;
  if (max === 0) return 0;
  
  const remaining = limits.DailyApiRequests.Remaining || 0;
  return ((max - remaining) / max) * 100;
};

const getLicenseTotal = (license: RawLicense): number => {
  return license?.TotalLicenses || license?.AllowedLicenses || 0;
};

const getLicenseUsed = (license: RawLicense): number => {
  return license?.UsedLicenses || 0;
};

export const calculateTotalSavings = (
  userLicenses: RawLicense[] | undefined,
  packageLicenses: RawLicense[] | undefined,
  sandboxes: any[] | undefined
): number => {
  if (!userLicenses || !packageLicenses || !sandboxes) return 0;
  
  const unusedLicensesSavings = userLicenses.reduce((total, license) => {
    const licenseTotal = getLicenseTotal(license);
    const licenseUsed = getLicenseUsed(license);
    const unused = licenseTotal - licenseUsed;
    return total + (unused * 100 * 12); // Assuming $100 per license per month
  }, 0);

  const unusedPackagesSavings = packageLicenses.reduce((total, pkg) => {
    const packageTotal = getLicenseTotal(pkg);
    const packageUsed = getLicenseUsed(pkg);
    const unused = packageTotal - packageUsed;
    return total + (unused * 50 * 12); // Assuming $50 per package license per month
  }, 0);

  const sandboxSavings = sandboxes.length > 1 ? (sandboxes.length - 1) * 5000 : 0; // $5000 per excess sandbox

  return unusedLicensesSavings + unusedPackagesSavings + sandboxSavings;
};
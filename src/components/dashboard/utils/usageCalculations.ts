import { OrgLimits } from "@/components/org-health/types";

export const calculateStorageUsage = (limits: OrgLimits | null): number => {
  if (!limits) return 0;
  const totalStorage = limits.DataStorageMB.Max + limits.FileStorageMB.Max;
  const usedStorage = totalStorage - (limits.DataStorageMB.Remaining + limits.FileStorageMB.Remaining);
  return (usedStorage / totalStorage) * 100;
};

export const calculateApiUsage = (limits: OrgLimits | null): number => {
  if (!limits) return 0;
  return limits.DailyApiRequests ? 
    ((limits.DailyApiRequests.Max - limits.DailyApiRequests.Remaining) / limits.DailyApiRequests.Max) * 100 
    : 0;
};

export const calculateTotalSavings = (
  userLicenses: Array<{ total: number; used: number }> | undefined,
  packageLicenses: Array<{ total: number; used: number }> | undefined,
  sandboxes: any[] | undefined
): number => {
  if (!userLicenses || !packageLicenses || !sandboxes) return 0;
  
  const unusedLicensesSavings = userLicenses.reduce((total, license) => {
    const unused = license.total - license.used;
    return total + (unused * 100 * 12); // Assuming $100 per license per month
  }, 0);

  const unusedPackagesSavings = packageLicenses.reduce((total, pkg) => {
    const unused = pkg.total - pkg.used;
    return total + (unused * 50 * 12); // Assuming $50 per package license per month
  }, 0);

  const sandboxSavings = sandboxes.length > 1 ? (sandboxes.length - 1) * 5000 : 0; // $5000 per excess sandbox

  return unusedLicensesSavings + unusedPackagesSavings + sandboxSavings;
};
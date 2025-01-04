import { FormattedLicense } from './types';
import { formatNumber, calculateUsagePercentage } from './formatters';

export const generateLicenseSection = (title: string, licenses: FormattedLicense[]): string[][] => {
  return [
    [title],
    ['Name', 'Total', 'Used', 'Available', 'Usage %'],
    ...licenses.map(license => [
      license.name,
      license.total.toString(),
      license.used.toString(),
      license.available.toString(),
      `${license.usagePercentage}%`
    ]),
    ['']
  ];
};

export const generateUserSection = (title: string, users: any[]): string[][] => {
  return [
    [title],
    ['Username', 'Last Login', 'User Type', 'Profile'],
    ...users.map(user => [
      user.Username || 'Unknown',
      user.LastLoginDate || 'Never',
      user.UserType || 'Unknown',
      user.Profile?.Name || 'N/A'
    ]),
    ['']
  ];
};

export const generateSandboxSection = (sandboxes: any[]): string[][] => {
  return [
    ['Sandboxes'],
    ['Name', 'Type', 'Status'],
    ...sandboxes.map(sandbox => [
      sandbox.SandboxName || 'Unknown',
      sandbox.LicenseType || 'Unknown',
      sandbox.Status || 'Active'
    ]),
    ['']
  ];
};

export const generateLimitsSection = (limits: any): string[][] => {
  const formatLimitRow = (name: string, limit: any) => {
    const max = formatNumber(limit?.Max);
    const remaining = formatNumber(limit?.Remaining);
    const used = max - remaining;
    const usagePercentage = calculateUsagePercentage(used, max);
    
    return [
      name,
      used.toString(),
      max.toString(),
      remaining.toString(),
      `${usagePercentage}%`
    ];
  };

  return [
    ['Organization Limits'],
    ['Limit Type', 'Used', 'Total', 'Remaining', 'Usage %'],
    formatLimitRow('Data Storage (MB)', limits?.DataStorageMB),
    formatLimitRow('File Storage (MB)', limits?.FileStorageMB),
    formatLimitRow('Daily API Requests', limits?.DailyApiRequests)
  ];
};
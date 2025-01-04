import { FormattedLicense } from './types';
import { formatNumber, calculateUsagePercentage } from './formatters';

export const generateLicenseSection = (title: string, licenses: FormattedLicense[]): string[][] => {
  console.log(`Generating ${title} section with data:`, licenses);
  return [
    [title],
    ['Name', 'Total', 'Used', 'Available', 'Usage %'],
    ...licenses.map(license => {
      console.log(`Processing license:`, license);
      return [
        license.name,
        license.total.toString(),
        license.used.toString(),
        license.available.toString(),
        `${license.usagePercentage}%`
      ];
    }),
    ['']
  ];
};

export const generateUserSection = (title: string, users: any[]): string[][] => {
  console.log(`Generating ${title} section with ${users.length} users`);
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
  console.log('Generating sandbox section with data:', sandboxes);
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
  console.log('Generating limits section with data:', limits);
  const formatLimitRow = (name: string, limit: any) => {
    if (!limit) {
      console.log(`No limit data for ${name}`);
      return [name, '0', '0', '0', '0%'];
    }

    const max = formatNumber(limit.Max);
    const remaining = formatNumber(limit.Remaining);
    const used = max - remaining;
    const usagePercentage = calculateUsagePercentage(used, max);
    
    console.log(`Formatted ${name} limit:`, { max, remaining, used, usagePercentage });
    
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
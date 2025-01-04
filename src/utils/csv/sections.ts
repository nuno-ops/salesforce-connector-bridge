import { FormattedLicense } from './types';

export const generateLicenseSection = (title: string, licenses: FormattedLicense[]): string[][] => {
  console.log(`Generating ${title} section with data:`, licenses);
  return [
    [title],
    ['Name', 'Total', 'Used', 'Available', 'Usage %', 'Status'],
    ...licenses.map(license => [
      license.name,
      license.total.toString(),
      license.used.toString(),
      license.available.toString(),
      `${license.usagePercentage}%`,
      license.status || 'Active'
    ]),
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
  return [
    ['Organization Limits'],
    ['Limit Type', 'Used', 'Total', 'Remaining', 'Usage %'],
    ['Data Storage (MB)', 
      limits?.DataStorageMB?.Used?.toString() || '0',
      limits?.DataStorageMB?.Max?.toString() || '0',
      limits?.DataStorageMB?.Remaining?.toString() || '0',
      `${((limits?.DataStorageMB?.Used || 0) / (limits?.DataStorageMB?.Max || 1) * 100).toFixed(1)}%`
    ],
    ['File Storage (MB)',
      limits?.FileStorageMB?.Used?.toString() || '0',
      limits?.FileStorageMB?.Max?.toString() || '0',
      limits?.FileStorageMB?.Remaining?.toString() || '0',
      `${((limits?.FileStorageMB?.Used || 0) / (limits?.FileStorageMB?.Max || 1) * 100).toFixed(1)}%`
    ],
    ['Daily API Requests',
      limits?.DailyApiRequests?.Used?.toString() || '0',
      limits?.DailyApiRequests?.Max?.toString() || '0',
      limits?.DailyApiRequests?.Remaining?.toString() || '0',
      `${((limits?.DailyApiRequests?.Used || 0) / (limits?.DailyApiRequests?.Max || 1) * 100).toFixed(1)}%`
    ]
  ];
};
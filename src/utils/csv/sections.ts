import { FormattedLicense } from './types';

export const createLicenseSection = (title: string, licenses: FormattedLicense[]) => {
  console.log(`Creating ${title} section with data:`, licenses);
  
  return {
    title,
    headers: ['Name', 'Total', 'Used', 'Available', 'Usage %', 'Status'],
    rows: licenses.map(license => [
      license.name || 'Unknown',
      license.total.toString(),
      license.used.toString(),
      license.available.toString(),
      `${license.usagePercentage}%`,
      license.status || 'Active'
    ])
  };
};

export const createUserSection = (title: string, users: any[]) => {
  console.log(`Creating ${title} section with ${users.length} users`);
  
  return {
    title,
    headers: ['Username', 'Last Login', 'User Type', 'Profile'],
    rows: users.map(user => [
      user.Username || 'Unknown',
      user.LastLoginDate || 'Never',
      user.UserType || 'Unknown',
      user.Profile?.Name || 'N/A'
    ])
  };
};

export const createSandboxSection = (sandboxes: any[]) => {
  console.log('Creating sandbox section with data:', sandboxes);
  
  return {
    title: 'Sandboxes',
    headers: ['Name', 'Type', 'Status'],
    rows: sandboxes.map(sandbox => [
      sandbox.SandboxName || 'Unknown',
      sandbox.LicenseType || 'Unknown',
      sandbox.Status || 'Active'
    ])
  };
};

export const createLimitsSection = (limits: any) => {
  console.log('Creating limits section with data:', limits);
  
  return {
    title: 'Organization Limits',
    headers: ['Limit Type', 'Used', 'Total', 'Remaining', 'Usage %'],
    rows: [
      ['Data Storage (MB)', 
        (limits?.DataStorageMB?.Used || 0).toString(),
        (limits?.DataStorageMB?.Max || 0).toString(),
        (limits?.DataStorageMB?.Remaining || 0).toString(),
        `${((limits?.DataStorageMB?.Used || 0) / (limits?.DataStorageMB?.Max || 1) * 100).toFixed(1)}%`
      ],
      ['File Storage (MB)',
        (limits?.FileStorageMB?.Used || 0).toString(),
        (limits?.FileStorageMB?.Max || 0).toString(),
        (limits?.FileStorageMB?.Remaining || 0).toString(),
        `${((limits?.FileStorageMB?.Used || 0) / (limits?.FileStorageMB?.Max || 1) * 100).toFixed(1)}%`
      ],
      ['Daily API Requests',
        (limits?.DailyApiRequests?.Used || 0).toString(),
        (limits?.DailyApiRequests?.Max || 0).toString(),
        (limits?.DailyApiRequests?.Remaining || 0).toString(),
        `${((limits?.DailyApiRequests?.Used || 0) / (limits?.DailyApiRequests?.Max || 1) * 100).toFixed(1)}%`
      ]
    ]
  };
};
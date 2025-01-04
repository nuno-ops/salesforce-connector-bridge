import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";

interface ExportData {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  totalSavings?: number;
}

export const generateReportCSV = (data: ExportData) => {
  const {
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    sandboxes,
    limits,
    totalSavings
  } = data;

  const formattedUserLicenses = formatLicenseData(userLicenses);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);

  const csvContent = [
    // Header
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],

    // Total Savings
    ['Potential Annual Savings:', `$${totalSavings?.toLocaleString() || 0}`],
    [''],

    // User Licenses Section
    ['User Licenses'],
    ['Name', 'Total', 'Used', 'Available', 'Usage %'],
    ...formattedUserLicenses.map(license => [
      license.name,
      license.total,
      license.used,
      license.total - license.used,
      `${((license.used / license.total) * 100).toFixed(1)}%`
    ]),
    [''],

    // Package Licenses Section
    ['Package Licenses'],
    ['Name', 'Total', 'Used', 'Available', 'Usage %', 'Status'],
    ...formattedPackageLicenses.map(license => [
      license.name,
      license.total,
      license.used,
      license.total - license.used,
      `${((license.used / license.total) * 100).toFixed(1)}%`,
      license.status
    ]),
    [''],

    // Permission Set Licenses Section
    ['Permission Set Licenses'],
    ['Name', 'Total', 'Used', 'Available', 'Usage %'],
    ...formattedPermissionSetLicenses.map(license => [
      license.name,
      license.total,
      license.used,
      license.total - license.used,
      `${((license.used / license.total) * 100).toFixed(1)}%`
    ]),
    [''],

    // Sandboxes Section
    ['Sandboxes'],
    ['Name', 'Type', 'Status'],
    ...sandboxes.map(sandbox => [
      sandbox.SandboxName,
      sandbox.LicenseType,
      sandbox.Status || 'Active'
    ]),
    [''],

    // Organization Limits
    ['Organization Limits'],
    ['Limit Type', 'Used', 'Total', 'Remaining', 'Usage %'],
    ['Data Storage (MB)', 
      limits.DataStorageMB.Max - limits.DataStorageMB.Remaining,
      limits.DataStorageMB.Max,
      limits.DataStorageMB.Remaining,
      `${(((limits.DataStorageMB.Max - limits.DataStorageMB.Remaining) / limits.DataStorageMB.Max) * 100).toFixed(1)}%`
    ],
    ['File Storage (MB)',
      limits.FileStorageMB.Max - limits.FileStorageMB.Remaining,
      limits.FileStorageMB.Max,
      limits.FileStorageMB.Remaining,
      `${(((limits.FileStorageMB.Max - limits.FileStorageMB.Remaining) / limits.FileStorageMB.Max) * 100).toFixed(1)}%`
    ],
    ['Daily API Requests',
      limits.DailyApiRequests.Max - limits.DailyApiRequests.Remaining,
      limits.DailyApiRequests.Max,
      limits.DailyApiRequests.Remaining,
      `${(((limits.DailyApiRequests.Max - limits.DailyApiRequests.Remaining) / limits.DailyApiRequests.Max) * 100).toFixed(1)}%`
    ]
  ];

  return csvContent.map(row => row.join(',')).join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";
import { filterInactiveUsers, filterStandardSalesforceUsers } from "@/components/users/utils/userFilters";
import { calculateInactiveUserSavings } from "@/components/cost-savings/utils/savingsCalculations";
import { analyzeIntegrationOpportunities } from "@/components/cost-savings/utils/licenseCalculations";

interface ExportData {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  oauthTokens?: any[];
  users?: any[]; // Add users to the interface
}

export const generateReportCSV = (data: ExportData) => {
  const {
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    sandboxes,
    limits,
    oauthTokens = [],
    users = [] // Destructure users with default empty array
  } = data;

  const formattedUserLicenses = formatLicenseData(userLicenses);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);

  // Filter standard Salesforce users first
  const standardUsers = filterStandardSalesforceUsers(users);
  const inactiveUsers = filterInactiveUsers(standardUsers);
  
  const licensePrice = 150; // Default price if not set
  
  const inactiveSavings = calculateInactiveUserSavings(standardUsers, licensePrice);
  const potentialIntegrationUsers = analyzeIntegrationOpportunities(
    standardUsers,
    oauthTokens,
    inactiveUsers
  );

  const totalAnnualSavings = (inactiveUsers.length + potentialIntegrationUsers.length) * licensePrice * 12;

  const csvContent = [
    // Header & Summary
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Potential Annual Savings:', `$${totalAnnualSavings.toLocaleString()}`],
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

    // Inactive Users Section
    ['Inactive Users'],
    ['Username', 'Last Login', 'User Type', 'Profile'],
    ...inactiveUsers.map(user => [
      user.Username,
      user.LastLoginDate || 'Never',
      user.UserType,
      user.Profile?.Name || 'N/A'
    ]),
    [''],

    // Integration Users Section
    ['Integration User Candidates'],
    ['Username', 'Last Login', 'User Type', 'Profile'],
    ...potentialIntegrationUsers.map(user => [
      user.Username,
      user.LastLoginDate || 'Never',
      user.UserType,
      user.Profile?.Name || 'N/A'
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
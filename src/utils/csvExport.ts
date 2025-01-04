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
  users?: any[];
  oauthTokens?: any[];
}

export const generateReportCSV = (data: ExportData) => {
  const {
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    sandboxes,
    limits,
    oauthTokens = [],
    users = []
  } = data;

  console.log('Raw user licenses:', userLicenses);
  console.log('Raw package licenses:', packageLicenses);
  console.log('Raw permission set licenses:', permissionSetLicenses);

  // Format license data with safe number handling
  const formattedUserLicenses = formatLicenseData(userLicenses).map(license => {
    const total = Number(license.total) || 0;
    const used = Number(license.used) || 0;
    const available = total - used;
    const usagePercentage = total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';
    
    return {
      ...license,
      total,
      used,
      available,
      usagePercentage
    };
  });

  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses).map(license => {
    const total = Number(license.total) || 0;
    const used = Number(license.used) || 0;
    const available = total - used;
    const usagePercentage = total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';
    
    return {
      ...license,
      total,
      used,
      available,
      usagePercentage
    };
  });

  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses).map(license => {
    const total = Number(license.total) || 0;
    const used = Number(license.used) || 0;
    const available = total - used;
    const usagePercentage = total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';
    
    return {
      ...license,
      total,
      used,
      available,
      usagePercentage
    };
  });

  console.log('Formatted user licenses:', formattedUserLicenses);
  console.log('Formatted package licenses:', formattedPackageLicenses);
  console.log('Formatted permission set licenses:', formattedPermissionSetLicenses);

  // Filter users
  const standardUsers = filterStandardSalesforceUsers(users);
  const inactiveUsers = filterInactiveUsers(standardUsers);
  const potentialIntegrationUsers = analyzeIntegrationOpportunities(
    standardUsers,
    oauthTokens,
    inactiveUsers
  );

  const licensePrice = 150; // Default price if not set
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
      license.name || 'Unknown',
      license.total,
      license.used,
      license.available,
      `${license.usagePercentage}%`
    ]),
    [''],

    // Package Licenses Section
    ['Package Licenses'],
    ['Name', 'Total', 'Used', 'Available', 'Usage %', 'Status'],
    ...formattedPackageLicenses.map(license => [
      license.name || 'Unknown',
      license.total,
      license.used,
      license.available,
      `${license.usagePercentage}%`,
      license.status || 'Unknown'
    ]),
    [''],

    // Permission Set Licenses Section
    ['Permission Set Licenses'],
    ['Name', 'Total', 'Used', 'Available', 'Usage %'],
    ...formattedPermissionSetLicenses.map(license => [
      license.name || 'Unknown',
      license.total,
      license.used,
      license.available,
      `${license.usagePercentage}%`
    ]),
    [''],

    // Inactive Users Section
    ['Inactive Users'],
    ['Username', 'Last Login', 'User Type', 'Profile'],
    ...inactiveUsers.map(user => [
      user.Username || 'Unknown',
      user.LastLoginDate || 'Never',
      user.UserType || 'Unknown',
      user.Profile?.Name || 'N/A'
    ]),
    [''],

    // Integration Users Section
    ['Integration User Candidates'],
    ['Username', 'Last Login', 'User Type', 'Profile'],
    ...potentialIntegrationUsers.map(user => [
      user.Username || 'Unknown',
      user.LastLoginDate || 'Never',
      user.UserType || 'Unknown',
      user.Profile?.Name || 'N/A'
    ]),
    [''],

    // Sandboxes Section
    ['Sandboxes'],
    ['Name', 'Type', 'Status'],
    ...sandboxes.map(sandbox => [
      sandbox.SandboxName || 'Unknown',
      sandbox.LicenseType || 'Unknown',
      sandbox.Status || 'Active'
    ]),
    [''],

    // Organization Limits
    ['Organization Limits'],
    ['Limit Type', 'Used', 'Total', 'Remaining', 'Usage %'],
    ['Data Storage (MB)', 
      (limits?.DataStorageMB?.Max - limits?.DataStorageMB?.Remaining) || 0,
      limits?.DataStorageMB?.Max || 0,
      limits?.DataStorageMB?.Remaining || 0,
      `${(((limits?.DataStorageMB?.Max - limits?.DataStorageMB?.Remaining) / limits?.DataStorageMB?.Max) * 100 || 0).toFixed(1)}%`
    ],
    ['File Storage (MB)',
      (limits?.FileStorageMB?.Max - limits?.FileStorageMB?.Remaining) || 0,
      limits?.FileStorageMB?.Max || 0,
      limits?.FileStorageMB?.Remaining || 0,
      `${(((limits?.FileStorageMB?.Max - limits?.FileStorageMB?.Remaining) / limits?.FileStorageMB?.Max) * 100 || 0).toFixed(1)}%`
    ],
    ['Daily API Requests',
      (limits?.DailyApiRequests?.Max - limits?.DailyApiRequests?.Remaining) || 0,
      limits?.DailyApiRequests?.Max || 0,
      limits?.DailyApiRequests?.Remaining || 0,
      `${(((limits?.DailyApiRequests?.Max - limits?.DailyApiRequests?.Remaining) / limits?.DailyApiRequests?.Max) * 100 || 0).toFixed(1)}%`
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
  window.URL.revokeObjectURL(url);
};
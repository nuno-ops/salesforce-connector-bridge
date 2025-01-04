import { ExportData } from './types';
import { formatLicenseData, formatCurrency } from './formatters';
import { generateLicenseSection, generateUserSection, generateSandboxSection, generateLimitsSection } from './sections';
import { filterInactiveUsers, filterStandardSalesforceUsers } from "@/components/users/utils/userFilters";
import { analyzeIntegrationOpportunities } from "@/components/cost-savings/utils/licenseCalculations";

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

  console.log('Processing raw license data:', {
    userLicenses,
    packageLicenses,
    permissionSetLicenses
  });

  // Format license data
  const formattedUserLicenses = userLicenses.map(formatLicenseData);
  const formattedPackageLicenses = packageLicenses.map(formatLicenseData);
  const formattedPermissionSetLicenses = permissionSetLicenses.map(formatLicenseData);

  console.log('Formatted license data:', {
    formattedUserLicenses,
    formattedPackageLicenses,
    formattedPermissionSetLicenses
  });

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

  console.log('Savings calculations:', {
    inactiveUsersCount: inactiveUsers.length,
    potentialIntegrationUsersCount: potentialIntegrationUsers.length,
    licensePrice,
    totalAnnualSavings
  });

  const csvContent = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Potential Annual Savings:', formatCurrency(totalAnnualSavings)],
    [''],
    ...generateLicenseSection('User Licenses', formattedUserLicenses),
    ...generateLicenseSection('Package Licenses', formattedPackageLicenses),
    ...generateLicenseSection('Permission Set Licenses', formattedPermissionSetLicenses),
    ...generateUserSection('Inactive Users', inactiveUsers),
    ...generateUserSection('Integration User Candidates', potentialIntegrationUsers),
    ...generateSandboxSection(sandboxes),
    ...generateLimitsSection(limits)
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
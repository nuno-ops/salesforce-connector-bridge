import { ExportData } from './types';
import { formatLicenseData, formatCurrency } from './formatters';
import { filterInactiveUsers, filterStandardSalesforceUsers } from "@/components/users/utils/userFilters";
import { analyzeIntegrationOpportunities } from "@/components/cost-savings/utils/licenseCalculations";
import { 
  generateLicenseSection, 
  generateUserSection, 
  generateSandboxSection, 
  generateLimitsSection 
} from './sections';

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

  // Format license data
  const formattedUserLicenses = userLicenses.map(license => formatLicenseData(license));
  const formattedPackageLicenses = packageLicenses.map(license => formatLicenseData(license));
  const formattedPermissionSetLicenses = permissionSetLicenses.map(license => formatLicenseData(license));

  console.log('Formatted user licenses:', formattedUserLicenses);
  console.log('Formatted package licenses:', formattedPackageLicenses);
  console.log('Formatted permission set licenses:', formattedPermissionSetLicenses);

  // Filter and analyze users
  const standardUsers = filterStandardSalesforceUsers(users);
  const inactiveUsers = filterInactiveUsers(standardUsers);
  const potentialIntegrationUsers = analyzeIntegrationOpportunities(
    standardUsers,
    oauthTokens,
    inactiveUsers
  );

  const licensePrice = 150; // Default price if not set
  const totalAnnualSavings = (formattedUserLicenses.length + formattedPackageLicenses.length + formattedPermissionSetLicenses.length) * licensePrice * 12;

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
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

  console.log('CSV Generation - Raw user licenses:', JSON.stringify(userLicenses, null, 2));
  console.log('CSV Generation - Raw package licenses:', JSON.stringify(packageLicenses, null, 2));
  console.log('CSV Generation - Raw permission set licenses:', JSON.stringify(permissionSetLicenses, null, 2));

  // Format license data with safe number handling
  const formattedUserLicenses = userLicenses.map(license => {
    console.log('Formatting user license:', JSON.stringify(license, null, 2));
    return formatLicenseData(license);
  });

  const formattedPackageLicenses = packageLicenses.map(license => {
    console.log('Formatting package license:', JSON.stringify(license, null, 2));
    return formatLicenseData(license);
  });

  const formattedPermissionSetLicenses = permissionSetLicenses.map(license => {
    console.log('Formatting permission set license:', JSON.stringify(license, null, 2));
    return formatLicenseData(license);
  });

  console.log('CSV Generation - Formatted user licenses:', JSON.stringify(formattedUserLicenses, null, 2));
  console.log('CSV Generation - Formatted package licenses:', JSON.stringify(formattedPackageLicenses, null, 2));
  console.log('CSV Generation - Formatted permission set licenses:', JSON.stringify(formattedPermissionSetLicenses, null, 2));

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
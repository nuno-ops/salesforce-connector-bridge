import { ExportData } from './csv/types';
import { createLicenseSection } from './csv/sections/licenseSection';
import { createSandboxSection } from './csv/sections/sandboxSection';
import { createLimitsSection } from './csv/sections/limitsSection';
import { createUserSection } from './csv/sections/userSection';
import { filterStandardSalesforceUsers, filterInactiveUsers } from '@/components/users/utils/userFilters';
import { calculateTotalSavings } from '@/components/dashboard/utils/usageCalculations';

export const generateReportCSV = (data: ExportData) => {
  console.log('Generating CSV with raw data:', data);

  // Process users data
  const standardUsers = filterStandardSalesforceUsers(data.users || []);
  const inactiveUsers = filterInactiveUsers(standardUsers);
  
  // Find integration users (users with OAuth tokens)
  const integrationUsers = standardUsers.filter(user => {
    const userTokens = data.oauthTokens?.filter(token => token.UserId === user.Id) || [];
    user.connectedApps = userTokens.map(token => token.AppName);
    return userTokens.length > 0;
  });

  // Get platform license users
  const platformUsers = standardUsers.filter(user => user.isPlatformEligible);

  // Calculate total potential annual savings
  const totalSavings = calculateTotalSavings(
    data.userLicenses,
    data.packageLicenses,
    data.sandboxes
  );

  const sections = [
    createLicenseSection('User Licenses', data.userLicenses),
    createLicenseSection('Package Licenses', data.packageLicenses),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses),
    createSandboxSection(data.sandboxes),
    createLimitsSection(data.limits),
    createUserSection('Inactive Users', inactiveUsers),
    createUserSection('Integration Users', integrationUsers),
    createUserSection('Platform License Users', platformUsers)
  ];

  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Potential Annual Savings:', `$${totalSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
    ['Generated on:', new Date().toLocaleString()],
    ['']
  ];

  sections.forEach(section => {
    if (section) {
      csvContent.push(
        [section.title],
        section.headers,
        ...section.rows,
        ['']
      );
    }
  });

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
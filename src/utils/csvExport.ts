import { ExportData } from './csv/types';
import { createLicenseSection } from './csv/sections/licenseSection';
import { createSandboxSection } from './csv/sections/sandboxSection';
import { createLimitsSection } from './csv/sections/limitsSection';
import { createUserSection } from './csv/sections/userSection';
import { filterStandardSalesforceUsers, filterInactiveUsers } from '@/components/users/utils/userFilters';
import { calculateInactiveUserSavings, calculateIntegrationUserSavings } from '@/components/cost-savings/utils/savingsCalculations';
import { calculatePlatformLicenseSavings } from '@/components/cost-savings/utils/platformLicenseSavings';
import { formatLicense } from './csv/formatters';

export const generateReportCSV = async (data: ExportData) => {
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

  // Calculate savings
  const licensePrice = 100; // Default price if not provided
  const inactiveSavings = calculateInactiveUserSavings(standardUsers, licensePrice);
  const integrationSavings = calculateIntegrationUserSavings(
    standardUsers,
    data.oauthTokens || [],
    licensePrice,
    data.userLicenses || []
  );
  const platformSavings = await calculatePlatformLicenseSavings(licensePrice);

  const totalAnnualSavings = 
    inactiveSavings.savings +
    integrationSavings.savings +
    platformSavings.savings;

  // Create savings summary section
  const savingsSummarySection = {
    title: 'Potential Cost Savings Summary',
    headers: ['Category', 'Annual Savings (USD)'],
    rows: [
      ['Total Potential Annual Savings', `$${totalAnnualSavings.toLocaleString()}`],
      [''],
      ['Breakdown by Category:'],
      ['Inactive User Licenses', `$${inactiveSavings.savings.toLocaleString()}`],
      ['Integration User Optimization', `$${integrationSavings.savings.toLocaleString()}`],
      ['Platform License Optimization', `$${platformSavings.savings.toLocaleString()}`],
    ]
  };

  // Get platform license users
  const platformUsers = standardUsers.filter(user => user.isPlatformEligible);

  const sections = [
    savingsSummarySection,
    createLicenseSection('User Licenses', data.userLicenses || []),
    createLicenseSection('Package Licenses', data.packageLicenses || []),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses || []),
    createSandboxSection(data.sandboxes || []),
    createLimitsSection(data.limits),
    createUserSection('Inactive Users', inactiveUsers),
    createUserSection('Integration Users', integrationUsers),
    createUserSection('Platform License Users', platformUsers)
  ];

  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
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
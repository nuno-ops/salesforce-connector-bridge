import { ExportData } from './csv/types';
import { filterStandardSalesforceUsers } from '@/components/users/utils/userFilters';
import { createLicenseSection } from './csv/sections/licenseSection';
import { createSandboxSection } from './csv/sections/sandboxSection';
import { createLimitsSection } from './csv/sections/limitsSection';

export const generateReportCSV = async (data: ExportData): Promise<string> => {
  console.log('CSV Generation - Starting with raw data:', {
    userLicenses: data.userLicenses?.length,
    packageLicenses: data.packageLicenses?.length,
    users: data.users?.length,
    standardUsers: data.standardUsers?.length,
    licensePrice: data.licensePrice,
    savingsBreakdown: data.savingsBreakdown
  });

  // Process users data
  const standardUsers = data.standardUsers || [];
  const licensePrice = data.licensePrice || 0;

  console.log('CSV Generation - Processed user data:', {
    standardUserCount: standardUsers.length,
    licensePrice
  });

  // Calculate costs
  const totalMonthlyLicenseCost = licensePrice * standardUsers.length;
  const totalAnnualLicenseCost = totalMonthlyLicenseCost * 12;

  console.log('CSV Generation - Cost calculations:', {
    totalMonthlyLicenseCost,
    totalAnnualLicenseCost
  });

  // Calculate savings with fallbacks
  const savingsBreakdown = {
    inactiveUserSavings: { 
      savings: data.inactiveUserSavings || 0, 
      count: data.inactiveUserCount || 0 
    },
    integrationUserSavings: { 
      savings: data.integrationUserSavings || 0, 
      count: data.integrationUserCount || 0 
    },
    platformLicenseSavings: { 
      savings: data.platformLicenseSavings || 0, 
      count: data.platformLicenseCount || 0 
    },
    sandboxSavings: { 
      savings: data.sandboxSavings || 0, 
      count: data.excessSandboxCount || 0 
    },
    storageSavings: { 
      savings: data.storageSavings || 0, 
      potentialGBSavings: data.potentialStorageReduction || 0 
    }
  };

  const totalSavings = Object.values(savingsBreakdown).reduce((acc, curr) => 
    acc + (curr.savings || 0), 0
  );

  console.log('CSV Generation - Savings breakdown:', {
    savingsBreakdown,
    totalSavings
  });

  // Generate CSV content
  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', `$${licensePrice}`],
    ['Total Users:', standardUsers.length.toString()],
    ['Total Monthly License Cost:', `$${totalMonthlyLicenseCost.toLocaleString()}`],
    ['Total Annual License Cost:', `$${totalAnnualLicenseCost.toLocaleString()}`],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', `$${totalSavings.toLocaleString()}`],
    ['Percentage of Annual Cost:', `${totalAnnualLicenseCost > 0 ? ((totalSavings / totalAnnualLicenseCost) * 100).toFixed(1) : '0.0'}%`],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details', 'Percentage of Total Savings'],
    [
      'Inactive User Licenses', 
      `$${savingsBreakdown.inactiveUserSavings.savings.toLocaleString()}`,
      `$${(savingsBreakdown.inactiveUserSavings.savings / 12).toLocaleString()}`,
      `${savingsBreakdown.inactiveUserSavings.count} inactive users @ $${licensePrice}/month each`,
      `${totalSavings > 0 ? ((savingsBreakdown.inactiveUserSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Integration User Optimization', 
      `$${savingsBreakdown.integrationUserSavings.savings.toLocaleString()}`,
      `$${(savingsBreakdown.integrationUserSavings.savings / 12).toLocaleString()}`,
      `${savingsBreakdown.integrationUserSavings.count} users @ $${licensePrice}/month each`,
      `${totalSavings > 0 ? ((savingsBreakdown.integrationUserSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Platform License Optimization', 
      `$${savingsBreakdown.platformLicenseSavings.savings.toLocaleString()}`,
      `$${(savingsBreakdown.platformLicenseSavings.savings / 12).toLocaleString()}`,
      `${savingsBreakdown.platformLicenseSavings.count} users @ $${licensePrice - 25}/month savings each`,
      `${totalSavings > 0 ? ((savingsBreakdown.platformLicenseSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Sandbox Optimization', 
      `$${savingsBreakdown.sandboxSavings.savings.toLocaleString()}`,
      `$${(savingsBreakdown.sandboxSavings.savings / 12).toLocaleString()}`,
      `${savingsBreakdown.sandboxSavings.count} excess sandboxes`,
      `${totalSavings > 0 ? ((savingsBreakdown.sandboxSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Storage Optimization', 
      `$${savingsBreakdown.storageSavings.savings.toLocaleString()}`,
      `$${(savingsBreakdown.storageSavings.savings / 12).toLocaleString()}`,
      `${savingsBreakdown.storageSavings.potentialGBSavings}GB potential reduction`,
      `${totalSavings > 0 ? ((savingsBreakdown.storageSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ]
  ];

  // Add sections
  const sections = [
    createLicenseSection('User Licenses', data.userLicenses),
    createLicenseSection('Package Licenses', data.packageLicenses),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses),
    createSandboxSection(data.sandboxes),
    createLimitsSection(data.limits)
  ];

  console.log('CSV Generation - Created sections:', sections.map(s => s.title));

  sections.forEach(section => {
    if (section) {
      csvContent.push(
        [''],
        [section.title],
        section.headers,
        ...section.rows
      );
    }
  });

  console.log('CSV Generation - Final content structure:', {
    totalSections: sections.length,
    contentLength: csvContent.length
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
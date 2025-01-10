import { ExportData } from './csv/types';
import { createLicenseSection } from './csv/sections/licenseSection';
import { createSandboxSection } from './csv/sections/sandboxSection';
import { createLimitsSection } from './csv/sections/limitsSection';

export const generateReportCSV = async (data: ExportData): Promise<string> => {
  console.log('CSV Generation - Step 1: Received data:', {
    standardUsers: data.standardUsers?.length,
    licensePrice: data.licensePrice,
    inactiveUserSavings: data.inactiveUserSavings,
    integrationUserSavings: data.integrationUserSavings,
    platformLicenseSavings: data.platformLicenseSavings,
    inactiveUserCount: data.inactiveUserCount,
    integrationUserCount: data.integrationUserCount,
    platformLicenseCount: data.platformLicenseCount
  });

  // Process users data
  const standardUsers = data.standardUsers || [];
  const licensePrice = data.licensePrice || 0;

  // Calculate costs
  const totalMonthlyLicenseCost = licensePrice * standardUsers.length;
  const totalAnnualLicenseCost = totalMonthlyLicenseCost * 12;

  // Calculate total savings
  const totalSavings = (data.inactiveUserSavings || 0) +
                      (data.integrationUserSavings || 0) +
                      (data.platformLicenseSavings || 0) +
                      (data.sandboxSavings || 0) +
                      (data.storageSavings || 0);

  console.log('CSV Generation - Step 2: Calculated values:', {
    totalMonthlyLicenseCost,
    totalAnnualLicenseCost,
    totalSavings,
    savingsBreakdown: {
      inactiveUserSavings: data.inactiveUserSavings,
      integrationUserSavings: data.integrationUserSavings,
      platformLicenseSavings: data.platformLicenseSavings,
      sandboxSavings: data.sandboxSavings,
      storageSavings: data.storageSavings
    }
  });

  // Helper function to format currency values consistently
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', `$${licensePrice}`],
    ['Total Users:', standardUsers.length.toString()],
    ['Total Monthly License Cost:', `$${formatCurrency(totalMonthlyLicenseCost)}`],
    ['Total Annual License Cost:', `$${formatCurrency(totalAnnualLicenseCost)}`],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', `$${formatCurrency(totalSavings)}`],
    ['Percentage of Annual Cost:', `${totalAnnualLicenseCost > 0 ? ((totalSavings / totalAnnualLicenseCost) * 100).toFixed(1) : '0.0'}%`],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details', 'Percentage of Total Savings'],
    [
      'Inactive User Licenses',
      `$${formatCurrency(data.inactiveUserSavings || 0)}`,
      `$${formatCurrency((data.inactiveUserSavings || 0) / 12)}`,
      `${data.inactiveUserCount || 0} inactive users @ $${licensePrice}/month each`,
      `${totalSavings > 0 ? (((data.inactiveUserSavings || 0) / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Integration User Optimization',
      `$${formatCurrency(data.integrationUserSavings || 0)}`,
      `$${formatCurrency((data.integrationUserSavings || 0) / 12)}`,
      `${data.integrationUserCount || 0} users @ $${licensePrice}/month each`,
      `${totalSavings > 0 ? (((data.integrationUserSavings || 0) / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Platform License Optimization',
      `$${formatCurrency(data.platformLicenseSavings || 0)}`,
      `$${formatCurrency((data.platformLicenseSavings || 0) / 12)}`,
      `${data.platformLicenseCount || 0} users @ $${licensePrice - 25}/month savings each`,
      `${totalSavings > 0 ? (((data.platformLicenseSavings || 0) / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Sandbox Optimization',
      `$${formatCurrency(data.sandboxSavings || 0)}`,
      `$${formatCurrency((data.sandboxSavings || 0) / 12)}`,
      `${data.excessSandboxCount || 0} excess sandboxes`,
      `${totalSavings > 0 ? (((data.sandboxSavings || 0) / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Storage Optimization',
      `$${formatCurrency(data.storageSavings || 0)}`,
      `$${formatCurrency((data.storageSavings || 0) / 12)}`,
      `${data.potentialStorageReduction || 0}GB potential reduction`,
      `${totalSavings > 0 ? (((data.storageSavings || 0) / totalSavings) * 100).toFixed(1) : '0.0'}%`
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
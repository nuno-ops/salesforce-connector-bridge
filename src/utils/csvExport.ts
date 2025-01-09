import { ExportData } from './csv/types';
import { createLicenseSection } from './csv/sections/licenseSection';
import { createSandboxSection } from './csv/sections/sandboxSection';
import { createLimitsSection } from './csv/sections/limitsSection';

export const generateReportCSV = async (data: ExportData): Promise<string> => {
  console.log('CSV Generation - Starting with data:', {
    standardUsers: data.standardUsers?.length,
    licensePrice: data.licensePrice,
    inactiveUserSavings: data.inactiveUserSavings,
    integrationUserSavings: data.integrationUserSavings,
    platformLicenseSavings: data.platformLicenseSavings
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

  console.log('CSV Generation - Calculated values:', {
    totalMonthlyLicenseCost,
    totalAnnualLicenseCost,
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
      `$${(data.inactiveUserSavings || 0).toLocaleString()}`,
      `$${((data.inactiveUserSavings || 0) / 12).toLocaleString()}`,
      `${data.inactiveUserCount || 0} inactive users @ $${licensePrice}/month each`,
      `${totalSavings > 0 ? (((data.inactiveUserSavings || 0) / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Integration User Optimization',
      `$${(data.integrationUserSavings || 0).toLocaleString()}`,
      `$${((data.integrationUserSavings || 0) / 12).toLocaleString()}`,
      `${data.integrationUserCount || 0} users @ $${licensePrice}/month each`,
      `${totalSavings > 0 ? (((data.integrationUserSavings || 0) / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Platform License Optimization',
      `$${(data.platformLicenseSavings || 0).toLocaleString()}`,
      `$${((data.platformLicenseSavings || 0) / 12).toLocaleString()}`,
      `${data.platformLicenseCount || 0} users @ $${licensePrice - 25}/month savings each`,
      `${totalSavings > 0 ? (((data.platformLicenseSavings || 0) / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Sandbox Optimization',
      `$${(data.sandboxSavings || 0).toLocaleString()}`,
      `$${((data.sandboxSavings || 0) / 12).toLocaleString()}`,
      `${data.excessSandboxCount || 0} excess sandboxes`,
      `${totalSavings > 0 ? (((data.sandboxSavings || 0) / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Storage Optimization',
      `$${(data.storageSavings || 0).toLocaleString()}`,
      `$${((data.storageSavings || 0) / 12).toLocaleString()}`,
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
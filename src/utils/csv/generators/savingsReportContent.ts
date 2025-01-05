import { CsvExportData } from '../types/exportTypes';

export const generateSavingsReportContent = ({
  licensePrice,
  standardUsers,
  savingsBreakdown: {
    inactiveUserSavings,
    integrationUserSavings,
    platformLicenseSavings,
    sandboxSavings,
    storageSavings,
    totalSavings
  }
}: CsvExportData): string[][] => {
  console.log('Generating CSV content with data:', {
    licensePrice,
    standardUsers: standardUsers?.length,
    savingsBreakdown: {
      inactiveUserSavings,
      integrationUserSavings,
      platformLicenseSavings,
      sandboxSavings,
      storageSavings,
      totalSavings
    }
  });

  const totalAnnualSavings = Math.round(totalSavings);
  const totalMonthlyLicenseCost = licensePrice * (standardUsers?.length || 0);
  const totalAnnualLicenseCost = totalMonthlyLicenseCost * 12;

  return [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', `$${licensePrice.toLocaleString('en-US')}`],
    ['Total Users:', `${standardUsers?.length || 0}`],
    ['Total Monthly License Cost:', `$${totalMonthlyLicenseCost.toLocaleString('en-US')}`],
    ['Total Annual License Cost:', `$${totalAnnualLicenseCost.toLocaleString('en-US')}`],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', `$${totalAnnualSavings.toLocaleString('en-US')}`],
    ['Percentage of Annual Cost:', `${((totalAnnualSavings / totalAnnualLicenseCost) * 100).toFixed(1)}%`],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details', 'Percentage of Total Savings'],
    [
      'Inactive User Licenses', 
      `$${Math.round(inactiveUserSavings.savings).toLocaleString('en-US')}`,
      `$${Math.round(inactiveUserSavings.savings / 12).toLocaleString('en-US')}`,
      `${inactiveUserSavings.count} inactive users @ $${licensePrice}/month each`,
      `${((inactiveUserSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Integration User Optimization', 
      `$${Math.round(integrationUserSavings.savings).toLocaleString('en-US')}`,
      `$${Math.round(integrationUserSavings.savings / 12).toLocaleString('en-US')}`,
      `${integrationUserSavings.count} users @ $${licensePrice}/month each`,
      `${((integrationUserSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Platform License Optimization', 
      `$${Math.round(platformLicenseSavings.savings).toLocaleString('en-US')}`,
      `$${Math.round(platformLicenseSavings.savings / 12).toLocaleString('en-US')}`,
      `${platformLicenseSavings.count} users @ $${licensePrice - 25}/month savings each`,
      `${((platformLicenseSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Sandbox Optimization', 
      `$${Math.round(sandboxSavings.savings).toLocaleString('en-US')}`,
      `$${Math.round(sandboxSavings.savings / 12).toLocaleString('en-US')}`,
      `${sandboxSavings.count} excess sandboxes`,
      `${((sandboxSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Storage Optimization', 
      `$${Math.round(storageSavings.savings).toLocaleString('en-US')}`,
      `$${Math.round(storageSavings.savings / 12).toLocaleString('en-US')}`,
      `${storageSavings.potentialGBSavings}GB potential reduction`,
      `${((storageSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    ['']
  ];
};
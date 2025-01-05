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

  return [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', `$${licensePrice.toLocaleString('en-US')}`],
    ['Total Users:', `${standardUsers?.length || 0}`],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', `$${Math.round(totalSavings).toLocaleString('en-US')}`],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details'],
    [
      'Inactive User Licenses', 
      `$${Math.round(inactiveUserSavings.savings).toLocaleString('en-US')}`,
      `$${Math.round(inactiveUserSavings.savings / 12).toLocaleString('en-US')}`,
      `${inactiveUserSavings.count} inactive users @ $${licensePrice}/month each`
    ],
    [
      'Integration User Optimization', 
      `$${Math.round(integrationUserSavings.savings).toLocaleString('en-US')}`,
      `$${Math.round(integrationUserSavings.savings / 12).toLocaleString('en-US')}`,
      `${integrationUserSavings.count} users @ $${licensePrice}/month each`
    ],
    [
      'Platform License Optimization', 
      `$${Math.round(platformLicenseSavings.savings).toLocaleString('en-US')}`,
      `$${Math.round(platformLicenseSavings.savings / 12).toLocaleString('en-US')}`,
      `${platformLicenseSavings.count} users @ $${licensePrice - 25}/month savings each`
    ],
    [
      'Sandbox Optimization', 
      `$${Math.round(sandboxSavings.savings).toLocaleString('en-US')}`,
      `$${Math.round(sandboxSavings.savings / 12).toLocaleString('en-US')}`,
      `${sandboxSavings.count} excess sandboxes`
    ],
    [
      'Storage Optimization', 
      `$${Math.round(storageSavings.savings).toLocaleString('en-US')}`,
      `$${Math.round(storageSavings.savings / 12).toLocaleString('en-US')}`,
      `${storageSavings.potentialGBSavings}GB potential reduction`
    ],
    ['']
  ];
};
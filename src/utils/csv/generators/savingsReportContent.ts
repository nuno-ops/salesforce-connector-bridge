import { CsvExportData } from '../types/exportTypes';

export const generateSavingsReportContent = ({
  licensePrice,
  standardUsers,
  savingsBreakdown: {
    inactiveUserSavings,
    integrationUserSavings,
    platformLicenseSavings,
    sandboxSavings: sandboxSavingsCalc,
    storageSavings: storageSavingsCalc,
    totalSavings
  }
}: CsvExportData): string[][] => {
  return [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', `"$${licensePrice.toLocaleString('en-US')}"`],
    ['Total Users:', `${standardUsers.length}`],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', `"$${Math.round(totalSavings).toLocaleString('en-US')}"`],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details'],
    [
      'Inactive User Licenses', 
      `"$${inactiveUserSavings.savings.toLocaleString('en-US')}"`,
      `"$${(inactiveUserSavings.savings / 12).toLocaleString('en-US')}"`,
      `${inactiveUserSavings.count} inactive users @ $${licensePrice}/month each`
    ],
    [
      'Integration User Optimization', 
      `"$${integrationUserSavings.savings.toLocaleString('en-US')}"`,
      `"$${(integrationUserSavings.savings / 12).toLocaleString('en-US')}"`,
      `${integrationUserSavings.count} users @ $${licensePrice}/month each`
    ],
    [
      'Platform License Optimization', 
      `"$${platformLicenseSavings.savings.toLocaleString('en-US')}"`,
      `"$${(platformLicenseSavings.savings / 12).toLocaleString('en-US')}"`,
      `${platformLicenseSavings.count} users @ $${licensePrice - 25}/month savings each`
    ],
    [
      'Sandbox Optimization', 
      `"$${sandboxSavingsCalc.savings.toLocaleString('en-US')}"`,
      `"$${(sandboxSavingsCalc.savings / 12).toLocaleString('en-US')}"`,
      `${sandboxSavingsCalc.count} excess sandboxes`
    ],
    [
      'Storage Optimization', 
      `"$${storageSavingsCalc.savings.toLocaleString('en-US')}"`,
      `"$${(storageSavingsCalc.savings / 12).toLocaleString('en-US')}"`,
      `${storageSavingsCalc.potentialGBSavings}GB potential reduction`
    ],
    [''],
    ['Percentage Breakdown'],
    ['Category', 'Percentage of Total Savings'],
    [
      'Inactive User Licenses',
      `${((inactiveUserSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Integration User Optimization',
      `${((integrationUserSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Platform License Optimization',
      `${((platformLicenseSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Sandbox Optimization',
      `${((sandboxSavingsCalc.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Storage Optimization',
      `${((storageSavingsCalc.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    ['']
  ];
};
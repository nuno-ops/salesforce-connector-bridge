import { ExportData } from '../types';

export const generateSavingsReportContent = ({
  licensePrice,
  standardUsers,
  savingsBreakdown
}: ExportData): string[][] => {
  console.log('Savings Report - Input:', {
    licensePrice,
    standardUsers,
    savingsBreakdown: JSON.stringify(savingsBreakdown, null, 2)
  });

  const {
    inactiveUserSavings,
    integrationUserSavings,
    platformLicenseSavings,
    sandboxSavings,
    storageSavings,
    totalSavings
  } = savingsBreakdown;

  const totalMonthlyLicenseCost = licensePrice * standardUsers.length;
  const totalAnnualLicenseCost = totalMonthlyLicenseCost * 12;

  console.log('Savings Report - Calculations:', {
    licensePrice,
    standardUsers: standardUsers.length,
    totalMonthlyLicenseCost,
    totalAnnualLicenseCost,
    totalSavings
  });

  const percentageOfAnnualCost = totalAnnualLicenseCost > 0 
    ? ((totalSavings / totalAnnualLicenseCost) * 100).toFixed(1) 
    : '0.0';

  return [
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
    ['Percentage of Annual Cost:', `${percentageOfAnnualCost}%`],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details', 'Percentage of Total Savings'],
    [
      'Inactive User Licenses', 
      `$${inactiveUserSavings.savings.toLocaleString()}`,
      `$${(inactiveUserSavings.savings / 12).toLocaleString()}`,
      `${inactiveUserSavings.count} inactive users @ $${licensePrice}/month each`,
      `${totalSavings > 0 ? ((inactiveUserSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Integration User Optimization', 
      `$${integrationUserSavings.savings.toLocaleString()}`,
      `$${(integrationUserSavings.savings / 12).toLocaleString()}`,
      `${integrationUserSavings.count} users @ $${licensePrice}/month each`,
      `${totalSavings > 0 ? ((integrationUserSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Platform License Optimization', 
      `$${platformLicenseSavings.savings.toLocaleString()}`,
      `$${(platformLicenseSavings.savings / 12).toLocaleString()}`,
      `${platformLicenseSavings.count} users @ $${licensePrice - 25}/month savings each`,
      `${totalSavings > 0 ? ((platformLicenseSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Sandbox Optimization', 
      `$${sandboxSavings.savings.toLocaleString()}`,
      `$${(sandboxSavings.savings / 12).toLocaleString()}`,
      `${sandboxSavings.count} excess sandboxes`,
      `${totalSavings > 0 ? ((sandboxSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Storage Optimization', 
      `$${storageSavings.savings.toLocaleString()}`,
      `$${(storageSavings.savings / 12).toLocaleString()}`,
      `${storageSavings.potentialGBSavings}GB potential reduction`,
      `${totalSavings > 0 ? ((storageSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    ['']
  ];
};
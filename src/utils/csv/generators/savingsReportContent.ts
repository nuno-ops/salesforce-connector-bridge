import { ExportData } from '../types';

export const generateSavingsReportContent = ({
  licensePrice,
  standardUsers,
  savingsBreakdown = []
}: ExportData): string[][] => {
  console.log('Savings Report - Input:', {
    licensePrice,
    standardUsers,
    savingsBreakdown: JSON.stringify(savingsBreakdown, null, 2)
  });

  // Find savings by category from the savingsBreakdown array
  const findSavings = (title: string) => {
    const item = savingsBreakdown.find(item => item.title === title);
    return {
      savings: item?.amount || 0,
      details: item?.details || ''
    };
  };

  const inactiveUserSavings = findSavings('Inactive User Licenses');
  const integrationUserSavings = findSavings('Integration User Optimization');
  const platformLicenseSavings = findSavings('Platform License Optimization');
  const sandboxSavings = findSavings('Sandbox Optimization');
  const storageSavings = findSavings('Storage Optimization');

  const totalSavings = savingsBreakdown.reduce((sum, item) => sum + item.amount, 0);

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
      inactiveUserSavings.details,
      `${totalSavings > 0 ? ((inactiveUserSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Integration User Optimization', 
      `$${integrationUserSavings.savings.toLocaleString()}`,
      `$${(integrationUserSavings.savings / 12).toLocaleString()}`,
      integrationUserSavings.details,
      `${totalSavings > 0 ? ((integrationUserSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Platform License Optimization', 
      `$${platformLicenseSavings.savings.toLocaleString()}`,
      `$${(platformLicenseSavings.savings / 12).toLocaleString()}`,
      platformLicenseSavings.details,
      `${totalSavings > 0 ? ((platformLicenseSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Sandbox Optimization', 
      `$${sandboxSavings.savings.toLocaleString()}`,
      `$${(sandboxSavings.savings / 12).toLocaleString()}`,
      sandboxSavings.details,
      `${totalSavings > 0 ? ((sandboxSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    [
      'Storage Optimization', 
      `$${storageSavings.savings.toLocaleString()}`,
      `$${(storageSavings.savings / 12).toLocaleString()}`,
      storageSavings.details,
      `${totalSavings > 0 ? ((storageSavings.savings / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ],
    ['']
  ];
};
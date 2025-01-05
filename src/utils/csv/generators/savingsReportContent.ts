import { CsvExportData } from '../types';

export const generateSavingsReportContent = ({
  licensePrice,
  standardUsers,
  savingsBreakdown
}: CsvExportData): string[][] => {
  console.log('Generating savings report with detailed data:', {
    licensePrice,
    standardUsers,
    savingsBreakdown
  });

  const {
    inactiveUserSavings,
    integrationUserSavings,
    platformLicenseSavings,
    sandboxSavings,
    storageSavings,
    totalSavings
  } = savingsBreakdown;

  const totalMonthlyLicenseCost = Number(licensePrice) * Number(standardUsers);
  const totalAnnualLicenseCost = totalMonthlyLicenseCost * 12;
  
  console.log('Cost calculations:', {
    totalMonthlyLicenseCost,
    totalAnnualLicenseCost,
    totalSavings
  });

  const percentageOfAnnualCost = totalAnnualLicenseCost > 0 
    ? ((Number(totalSavings) / totalAnnualLicenseCost) * 100).toFixed(1) 
    : '0.0';

  // Format numbers for better readability
  const formatCurrency = (amount: number) => amount.toLocaleString('en-US');
  const formatPercentage = (amount: number, total: number) => 
    total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0';

  console.log('Savings breakdown calculations:', {
    inactiveUsers: {
      savings: inactiveUserSavings.savings,
      count: inactiveUserSavings.count,
      percentage: formatPercentage(inactiveUserSavings.savings, totalSavings)
    },
    integrationUsers: {
      savings: integrationUserSavings.savings,
      count: integrationUserSavings.count,
      percentage: formatPercentage(integrationUserSavings.savings, totalSavings)
    },
    platformLicenses: {
      savings: platformLicenseSavings.savings,
      count: platformLicenseSavings.count,
      percentage: formatPercentage(platformLicenseSavings.savings, totalSavings)
    }
  });

  return [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', `$${formatCurrency(licensePrice)}`],
    ['Total Users:', standardUsers.toString()],
    ['Total Monthly License Cost:', `$${formatCurrency(totalMonthlyLicenseCost)}`],
    ['Total Annual License Cost:', `$${formatCurrency(totalAnnualLicenseCost)}`],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', `$${formatCurrency(totalSavings)}`],
    ['Percentage of Annual Cost:', `${percentageOfAnnualCost}%`],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details', 'Percentage of Total Savings'],
    [
      'Inactive User Licenses', 
      `$${formatCurrency(inactiveUserSavings.savings)}`,
      `$${formatCurrency(inactiveUserSavings.savings / 12)}`,
      `${inactiveUserSavings.count} inactive users @ $${licensePrice}/month each`,
      `${formatPercentage(inactiveUserSavings.savings, totalSavings)}%`
    ],
    [
      'Integration User Optimization', 
      `$${formatCurrency(integrationUserSavings.savings)}`,
      `$${formatCurrency(integrationUserSavings.savings / 12)}`,
      `${integrationUserSavings.count} users @ $${licensePrice}/month each`,
      `${formatPercentage(integrationUserSavings.savings, totalSavings)}%`
    ],
    [
      'Platform License Optimization', 
      `$${formatCurrency(platformLicenseSavings.savings)}`,
      `$${formatCurrency(platformLicenseSavings.savings / 12)}`,
      `${platformLicenseSavings.count} users @ $${licensePrice - 25}/month savings each`,
      `${formatPercentage(platformLicenseSavings.savings, totalSavings)}%`
    ],
    [
      'Sandbox Optimization', 
      `$${formatCurrency(sandboxSavings.savings)}`,
      `$${formatCurrency(sandboxSavings.savings / 12)}`,
      `${sandboxSavings.count} excess sandboxes`,
      `${formatPercentage(sandboxSavings.savings, totalSavings)}%`
    ],
    [
      'Storage Optimization', 
      `$${formatCurrency(storageSavings.savings)}`,
      `$${formatCurrency(storageSavings.savings / 12)}`,
      `${storageSavings.potentialGBSavings}GB potential reduction`,
      `${formatPercentage(storageSavings.savings, totalSavings)}%`
    ],
    ['']
  ];
};
import { ExportData } from '../types';

export const generateSavingsReportContent = ({
  licensePrice,
  standardUsers,
  savingsBreakdown
}: ExportData): string[][] => {
  // Helper function to format currency values consistently without commas
  const formatCurrency = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const platformSavings = savingsBreakdown.find(item => item.title === "Platform License Optimization");
  const platformUserCount = platformSavings?.count || 0;
  const platformSavingsPerUser = licensePrice - 25; // Calculate dynamic savings (standard license - platform license cost)

  return [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', `$${licensePrice}`],
    ['Total Users:', standardUsers.length.toString()],
    ['Total Monthly License Cost:', `$${formatCurrency(licensePrice * standardUsers.length)}`],
    ['Total Annual License Cost:', `$${formatCurrency(licensePrice * standardUsers.length * 12)}`],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', `$${formatCurrency(savingsBreakdown.reduce((acc, curr) => acc + curr.amount, 0))}`],
    ['Percentage of Annual Cost:', `${((savingsBreakdown.reduce((acc, curr) => acc + curr.amount, 0) / (licensePrice * standardUsers.length * 12)) * 100).toFixed(1)}%`],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details', 'Percentage of Total Savings'],
    [
      'Inactive User Licenses',
      `$${formatCurrency((savingsBreakdown.find(item => item.title === "Inactive User Licenses")?.amount || 0))}`,
      `$${formatCurrency((savingsBreakdown.find(item => item.title === "Inactive User Licenses")?.amount || 0) / 12)}`,
      `${savingsBreakdown.find(item => item.title === "Inactive User Licenses")?.count || 0} inactive users @ $${licensePrice}/month each`,
      `${((savingsBreakdown.find(item => item.title === "Inactive User Licenses")?.amount || 0) / savingsBreakdown.reduce((acc, curr) => acc + curr.amount, 0) * 100).toFixed(1)}%`
    ],
    [
      'Integration User Optimization',
      `$${formatCurrency((savingsBreakdown.find(item => item.title === "Integration User Optimization")?.amount || 0))}`,
      `$${formatCurrency((savingsBreakdown.find(item => item.title === "Integration User Optimization")?.amount || 0) / 12)}`,
      `${savingsBreakdown.find(item => item.title === "Integration User Optimization")?.count || 0} users @ $${licensePrice}/month each`,
      `${((savingsBreakdown.find(item => item.title === "Integration User Optimization")?.amount || 0) / savingsBreakdown.reduce((acc, curr) => acc + curr.amount, 0) * 100).toFixed(1)}%`
    ],
    [
      'Platform License Optimization',
      `$${formatCurrency((savingsBreakdown.find(item => item.title === "Platform License Optimization")?.amount || 0))}`,
      `$${formatCurrency((savingsBreakdown.find(item => item.title === "Platform License Optimization")?.amount || 0) / 12)}`,
      `${platformUserCount} users @ $${platformSavingsPerUser}/month savings each`,
      `${((savingsBreakdown.find(item => item.title === "Platform License Optimization")?.amount || 0) / savingsBreakdown.reduce((acc, curr) => acc + curr.amount, 0) * 100).toFixed(1)}%`
    ],
    [
      'Sandbox Optimization',
      `$${formatCurrency((savingsBreakdown.find(item => item.title === "Sandbox Optimization")?.amount || 0))}`,
      `$${formatCurrency((savingsBreakdown.find(item => item.title === "Sandbox Optimization")?.amount || 0) / 12)}`,
      `${savingsBreakdown.find(item => item.title === "Sandbox Optimization")?.count || 0} excess sandboxes`,
      `${((savingsBreakdown.find(item => item.title === "Sandbox Optimization")?.amount || 0) / savingsBreakdown.reduce((acc, curr) => acc + curr.amount, 0) * 100).toFixed(1)}%`
    ],
    [
      'Storage Optimization',
      `$${formatCurrency((savingsBreakdown.find(item => item.title === "Storage Optimization")?.amount || 0))}`,
      `$${formatCurrency((savingsBreakdown.find(item => item.title === "Storage Optimization")?.amount || 0) / 12)}`,
      `${savingsBreakdown.find(item => item.title === "Storage Optimization")?.potentialGBSavings || 0}GB potential reduction`,
      `${((savingsBreakdown.find(item => item.title === "Storage Optimization")?.amount || 0) / savingsBreakdown.reduce((acc, curr) => acc + curr.amount, 0) * 100).toFixed(1)}%`
    ],
    ['']
  ];
};
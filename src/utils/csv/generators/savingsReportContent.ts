import { ExportData, CSVSection } from '../types';
import { createLicenseSection } from '../sections/licenseSection';
import { createSandboxSection } from '../sections/sandboxSection';
import { createLimitsSection } from '../sections/limitsSection';

export const generateSavingsReportContent = ({
  licensePrice,
  standardUsers,
  savingsBreakdown,
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits,
  storageUsage
}: ExportData): string[][] => {
  console.log('=== CSV Generation Started ===');
  console.log('Input data:', {
    licensePrice,
    standardUsersCount: standardUsers?.length,
    breakdownItems: savingsBreakdown?.length,
    userLicensesCount: userLicenses?.length,
    packageLicensesCount: packageLicenses?.length,
    sandboxesCount: sandboxes?.length,
    hasLimits: !!limits,
    storageUsage
  });

  // Helper function to format currency values consistently without commas
  const formatCurrency = (value: number): string => {
    if (!value) return '$0';
    return `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
  };

  // Calculate total savings
  const totalSavings = savingsBreakdown?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const totalMonthlyLicenseCost = (licensePrice || 0) * (standardUsers?.length || 0);
  const totalAnnualLicenseCost = totalMonthlyLicenseCost * 12;

  console.log('Calculated values:', {
    totalSavings,
    totalMonthlyLicenseCost,
    totalAnnualLicenseCost
  });

  // Generate the CSV content
  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', formatCurrency(licensePrice || 0)],
    ['Total Users:', (standardUsers?.length || 0).toString()],
    ['Total Monthly License Cost:', formatCurrency(totalMonthlyLicenseCost)],
    ['Total Annual License Cost:', formatCurrency(totalAnnualLicenseCost)],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', formatCurrency(totalSavings)],
    ['Percentage of Annual Cost:', totalAnnualLicenseCost > 0 ? 
      `${((totalSavings / totalAnnualLicenseCost) * 100).toFixed(1)}%` : '0%'],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details', 'Percentage of Total Savings']
  ];

  // Add each savings category
  savingsBreakdown?.forEach(item => {
    const monthlySavings = (item.amount || 0) / 12;
    const percentageOfTotal = totalSavings > 0 ? 
      ((item.amount || 0) / totalSavings * 100).toFixed(1) : '0.0';

    csvContent.push([
      item.title,
      formatCurrency(item.amount || 0),
      formatCurrency(monthlySavings),
      item.details,
      `${percentageOfTotal}%`
    ]);
  });

  // Add License sections
  if (userLicenses?.length > 0) {
    console.log('Creating User License section with:', userLicenses.length, 'licenses');
    const userLicenseSection = createLicenseSection('User License Details', userLicenses);
    csvContent.push([''], [userLicenseSection.title], userLicenseSection.headers);
    csvContent.push(...userLicenseSection.rows);
  }

  if (packageLicenses?.length > 0) {
    console.log('Creating Package License section with:', packageLicenses.length, 'licenses');
    const packageLicenseSection = createLicenseSection('Package License Details', packageLicenses);
    csvContent.push([''], [packageLicenseSection.title], packageLicenseSection.headers);
    csvContent.push(...packageLicenseSection.rows);
  }

  // Add Sandbox Information
  if (sandboxes?.length > 0) {
    console.log('Creating sandbox section with data:', sandboxes);
    const sandboxSection = createSandboxSection(sandboxes);
    csvContent.push([''], [sandboxSection.title], sandboxSection.headers);
    csvContent.push(...sandboxSection.rows);
  }

  // Add Storage and Limits Information
  if (limits) {
    const limitsSection = createLimitsSection(limits);
    csvContent.push([''], [limitsSection.title], limitsSection.headers);
    csvContent.push(...limitsSection.rows);
  }

  console.log('=== CSV Generation Completed ===');
  console.log('Final CSV content rows:', csvContent.length);

  return csvContent;
};
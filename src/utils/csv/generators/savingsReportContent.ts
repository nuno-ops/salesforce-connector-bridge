
import { RawLicense, CSVSection } from "@/utils/csv/types";
import { createLicenseSection } from "../sections/licenseSection";
import { createSandboxSection } from "../sections/sandboxSection";
import { createLimitsSection } from "../sections/limitsSection";

export const generateSavingsReportContent = ({
  userLicenses,
  packageLicenses,
  sandboxes,
  standardUsers,
  licensePrice,
  savingsBreakdown,
  limits,
  storageUsage,
}: {
  userLicenses: RawLicense[];
  packageLicenses: RawLicense[];
  sandboxes: any[];
  standardUsers: any[];
  licensePrice: number;
  savingsBreakdown: any[];
  limits: any;
  storageUsage?: number;
}): string[][] => {
  console.log('=== CSV Generation Started ===');
  console.log('Using license price:', licensePrice);
  console.log('Savings breakdown items:', savingsBreakdown);
  
  // Calculate totals using actual license price and all savings categories
  const totalSavings = savingsBreakdown.reduce((acc, item) => {
    console.log('Processing savings item:', item.title, 'Amount:', item.amount);
    return acc + (Number(item.amount) || 0);
  }, 0);
  
  const totalMonthlyLicenseCost = standardUsers.length * licensePrice;
  const totalAnnualLicenseCost = totalMonthlyLicenseCost * 12;

  // Create CSV rows array
  const csvRows: string[][] = [];

  // 1. Report Header Section
  csvRows.push(
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    ['Total Users:', standardUsers.length.toString()],
    ['Monthly License Cost:', `$${licensePrice.toFixed(2)}`],
    ['Annual License Cost:', `$${totalAnnualLicenseCost.toFixed(2)}`],
    ['']  // Empty row for spacing
  );

  // 2. Cost Savings Summary Section
  csvRows.push(
    ['Cost Savings Summary'],
    ['Category', 'Annual Savings', 'Details']
  );

  // Add all savings categories from savingsBreakdown with detailed logging
  savingsBreakdown.forEach(item => {
    const amount = Number(item.amount);
    console.log('Processing savings category:', {
      title: item.title,
      amount: amount,
      details: item.details
    });
    
    // Include categories with any savings amount
    if (amount > 0) {
      csvRows.push([
        item.title,
        `$${amount.toFixed(2)}`,
        item.details || ''
      ]);
    }
  });

  // Add total savings row with proper formatting
  csvRows.push(
    ['Total Potential Annual Savings:', `$${totalSavings.toFixed(2)}`, ''],
    ['']  // Empty row for spacing
  );

  // 3. Organization Limits Section
  const limitsSection = createLimitsSection(limits);
  csvRows.push(
    [limitsSection.title],
    limitsSection.headers,
    ...limitsSection.rows,
    ['']  // Empty row for spacing
  );

  // 4. User License Section
  const userLicenseSection = createLicenseSection('User License Details', userLicenses);
  csvRows.push(
    [userLicenseSection.title],
    userLicenseSection.headers,
    ...userLicenseSection.rows,
    ['']  // Empty row for spacing
  );

  // 5. Package License Section
  const packageLicenseSection = createLicenseSection('Package License Details', packageLicenses);
  csvRows.push(
    [packageLicenseSection.title],
    packageLicenseSection.headers,
    ...packageLicenseSection.rows,
    ['']  // Empty row for spacing
  );

  // 6. Sandbox Section
  const sandboxSection = createSandboxSection(sandboxes);
  csvRows.push(
    [sandboxSection.title],
    sandboxSection.headers,
    ...sandboxSection.rows,
    ['']  // Empty row for spacing
  );

  console.log('=== CSV Generation Completed ===');
  console.log('Final CSV content rows:', csvRows.length);
  console.log('Total savings included:', totalSavings);
  console.log('All savings categories processed:', savingsBreakdown.map(item => item.title));

  return csvRows;
};

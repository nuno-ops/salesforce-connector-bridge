
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
  
  // Calculate totals using actual license price
  const totalSavings = savingsBreakdown.reduce((acc, item) => acc + (item.amount || 0), 0);
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

  // Add all savings categories from savingsBreakdown
  savingsBreakdown.forEach(item => {
    if (item.amount > 0) {  // Only include categories with savings
      csvRows.push([
        item.title,
        `$${item.amount.toFixed(2)}`,
        item.details
      ]);
    }
  });

  // Add total savings row
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
  console.log('License price used in report:', licensePrice);

  return csvRows;
};

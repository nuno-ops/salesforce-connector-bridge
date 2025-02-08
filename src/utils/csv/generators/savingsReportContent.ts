
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
  console.log('Raw savings breakdown:', JSON.stringify(savingsBreakdown, null, 2));
  
  // Create CSV rows array
  const csvRows: string[][] = [];

  // 1. Report Header Section
  csvRows.push(
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    ['Total Users:', standardUsers.length.toString()],
    ['Monthly License Cost:', `$${licensePrice.toFixed(2)}`],
    ['Annual License Cost:', `$${(standardUsers.length * licensePrice * 12).toFixed(2)}`],
    ['']  // Empty row for spacing
  );

  // 2. Cost Savings Summary Section
  csvRows.push(
    ['Cost Savings Summary'],
    ['Category', 'Annual Savings', 'Details']
  );

  // Define all possible savings categories to ensure consistent order
  const allCategories = [
    {
      key: 'Inactive User Licenses',
      match: (item: any) => item.title.includes('Inactive User')
    },
    {
      key: 'Integration User',
      match: (item: any) => item.title.includes('Integration User')
    },
    {
      key: 'Platform License User',
      match: (item: any) => item.title.includes('Platform License')
    }
  ];

  // Calculate total savings and add rows for each category
  let totalSavings = 0;

  // Add each category, even if amount is 0
  allCategories.forEach(category => {
    const item = savingsBreakdown.find(s => category.match(s));
    const amount = item ? parseFloat(String(item.amount)) : 0;
    
    console.log(`Processing category ${category.key}:`, {
      found: !!item,
      amount,
      details: item?.details || 'No savings identified'
    });

    totalSavings += isNaN(amount) ? 0 : amount;

    csvRows.push([
      category.key,
      `$${amount.toFixed(2)}`,
      item?.details || ''
    ]);
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
  console.log('Total savings included:', totalSavings);
  console.log('All categories processed:', allCategories.map(cat => ({
    category: cat.key,
    included: savingsBreakdown.some(s => cat.match(s))
  })));

  return csvRows;
};

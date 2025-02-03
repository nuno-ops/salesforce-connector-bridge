import { RawLicense } from "@/utils/csv/types";
import { createLicenseSection } from "../sections/licenseSection";
import { createSandboxSection } from "../sections/sandboxSection";

export const generateSavingsReportContent = ({
  userLicenses,
  packageLicenses,
  sandboxes,
  standardUsers,
  licensePrice,
  savingsBreakdown
}: {
  userLicenses: RawLicense[];
  packageLicenses: RawLicense[];
  sandboxes: any[];
  standardUsers: any[];
  licensePrice: number;
  savingsBreakdown: any[];
}): string[][] => {
  console.log('=== CSV Generation Started ===');
  console.log('Input data:', {
    licensePrice,
    standardUsersCount: standardUsers?.length,
    breakdownItems: savingsBreakdown?.length,
    userLicensesCount: userLicenses?.length,
    packageLicensesCount: packageLicenses?.length,
  });

  // Calculate totals
  const totalSavings = savingsBreakdown.reduce((acc, item) => acc + (item.savings || 0), 0);
  const totalMonthlyLicenseCost = standardUsers.length * licensePrice;
  const totalAnnualLicenseCost = totalMonthlyLicenseCost * 12;

  console.log('Calculated values:', {
    totalSavings,
    totalMonthlyLicenseCost,
    totalAnnualLicenseCost
  });

  // Create sections
  console.log('Creating User License section with:', userLicenses?.length, 'licenses');
  const userLicenseSection = createLicenseSection('User License Details', userLicenses);

  console.log('Creating Package License section with:', packageLicenses?.length, 'licenses');
  const packageLicenseSection = createLicenseSection('Package License Details', packageLicenses);

  console.log('Creating sandbox section with data:', sandboxes);
  const sandboxSection = createSandboxSection(sandboxes);

  console.log('=== CSV Generation Completed ===');
  console.log('Final CSV content rows:', [
    ...userLicenseSection,
    ...packageLicenseSection,
    ...sandboxSection
  ].length);

  return [
    ...userLicenseSection,
    ...packageLicenseSection,
    ...sandboxSection
  ];
};
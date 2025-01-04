import { ExportData } from './csv/types';
import { createLicenseSection } from './csv/sections/licenseSection';
import { createSandboxSection } from './csv/sections/sandboxSection';
import { createLimitsSection } from './csv/sections/limitsSection';
import { createUserSection } from './csv/sections/userSection';
import { filterStandardSalesforceUsers, filterInactiveUsers } from '@/components/users/utils/userFilters';
import { 
  calculateInactiveUserSavings,
  calculateIntegrationUserSavings,
  calculateSandboxSavings,
  calculateStorageSavings
} from '@/components/cost-savings/utils/savingsCalculations';
import { calculatePlatformLicenseSavings } from '@/components/cost-savings/utils/platformLicenseSavings';
import { formatLicenseData } from '@/components/org-health/utils';
import { UserLicense } from '@/components/org-health/types';

export const generateReportCSV = async (data: ExportData) => {
  console.log('Generating CSV with raw data:', data);

  // Process users data
  const standardUsers = filterStandardSalesforceUsers(data.users || []);
  const inactiveUsers = filterInactiveUsers(standardUsers);
  
  // Convert RawLicense[] to UserLicense[]
  const formattedUserLicenses = data.userLicenses ? data.userLicenses.map(license => ({
    Id: license.Id,
    Name: license.Name || '',
    TotalLicenses: license.TotalLicenses || 0,
    UsedLicenses: license.UsedLicenses || 0
  })) : [];
  
  // Calculate savings using the same functions as the dashboard
  const inactiveUserSavings = calculateInactiveUserSavings(standardUsers, data.licensePrice || 100);
  const integrationUserSavings = calculateIntegrationUserSavings(
    standardUsers,
    data.oauthTokens || [],
    data.licensePrice || 100,
    formattedUserLicenses
  );
  const sandboxSavingsCalc = calculateSandboxSavings(data.sandboxes || []);
  const storageSavingsCalc = calculateStorageSavings(data.storageUsage || 0);
  
  // Calculate platform license savings
  const platformLicenseSavings = await calculatePlatformLicenseSavings(data.licensePrice || 100);

  // Calculate total savings using the same formula as the dashboard
  const totalSavings = 
    inactiveUserSavings.savings +
    integrationUserSavings.savings +
    sandboxSavingsCalc.savings +
    storageSavingsCalc.savings +
    platformLicenseSavings.savings;

  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Potential Annual Savings:', `"$${Math.round(totalSavings).toLocaleString('en-US')}"`],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Savings Breakdown'],
    ['Category', 'Annual Savings', 'Details'],
    ['Inactive User Licenses', `"$${inactiveUserSavings.savings.toLocaleString('en-US')}"`, `${inactiveUserSavings.count} inactive users`],
    ['Integration User Optimization', `"$${integrationUserSavings.savings.toLocaleString('en-US')}"`, `${integrationUserSavings.count} potential conversions`],
    ['Platform License Optimization', `"$${platformLicenseSavings.savings.toLocaleString('en-US')}"`, `${platformLicenseSavings.count} eligible users`],
    ['Sandbox Optimization', `"$${sandboxSavingsCalc.savings.toLocaleString('en-US')}"`, `${sandboxSavingsCalc.count} excess sandboxes`],
    ['Storage Optimization', `"$${storageSavingsCalc.savings.toLocaleString('en-US')}"`, `${storageSavingsCalc.potentialGBSavings}GB potential reduction`],
    ['']
  ];

  const sections = [
    createLicenseSection('User Licenses', data.userLicenses || []),
    createLicenseSection('Package Licenses', data.packageLicenses || []),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses || []),
    createSandboxSection(data.sandboxes || []),
    createLimitsSection(data.limits),
    createUserSection('Inactive Users', inactiveUsers),
  ];

  sections.forEach(section => {
    if (section) {
      csvContent.push(
        [section.title],
        section.headers,
        ...section.rows,
        ['']
      );
    }
  });

  return csvContent.map(row => row.join(',')).join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
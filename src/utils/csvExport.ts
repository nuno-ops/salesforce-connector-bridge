import { ExportData } from '@/utils/csv/types';
import { createLicenseSection } from '@/utils/csv/sections/licenseSection';
import { createSandboxSection } from '@/utils/csv/sections/sandboxSection';
import { createLimitsSection } from '@/utils/csv/sections/limitsSection';
import { filterStandardSalesforceUsers } from '@/components/users/utils/userFilters';
import { generateSavingsReportContent } from './csv/generators/savingsReportContent';

export const generateReportCSV = async (data: ExportData): Promise<string> => {
  console.log('Starting CSV generation with data:', data);

  // Process users data
  const standardUsers = data.users ? filterStandardSalesforceUsers(data.users) : [];
  const standardUserCount = standardUsers.length;
  
  // Calculate savings
  const inactiveUserSavings = { savings: data.inactiveUserSavings || 0, count: data.inactiveUserCount || 0 };
  const integrationUserSavings = { savings: data.integrationUserSavings || 0, count: data.integrationUserCount || 0 };
  const platformLicenseSavings = { savings: data.platformLicenseSavings || 0, count: data.platformLicenseCount || 0 };
  const sandboxSavings = { savings: data.sandboxSavings || 0, count: data.excessSandboxCount || 0 };
  const storageSavings = { savings: data.storageSavings || 0, potentialGBSavings: data.potentialStorageReduction || 0 };
  
  const totalSavings = 
    inactiveUserSavings.savings +
    integrationUserSavings.savings +
    platformLicenseSavings.savings +
    sandboxSavings.savings +
    storageSavings.savings;

  // Generate savings report content with actual license price
  const csvContent = generateSavingsReportContent({
    licensePrice: data.licensePrice || 140, // Default to 140 if not provided
    standardUsers: standardUserCount,
    savingsBreakdown: {
      inactiveUserSavings,
      integrationUserSavings,
      platformLicenseSavings,
      sandboxSavings,
      storageSavings,
      totalSavings
    }
  });

  // Create all sections
  const sections = [
    createLicenseSection('User Licenses', data.userLicenses || []),
    createLicenseSection('Package Licenses', data.packageLicenses || []),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses || []),
    createSandboxSection(data.sandboxes || []),
    createLimitsSection(data.limits || {})
  ];

  // Add all sections to CSV content
  sections.forEach(section => {
    if (section) {
      csvContent.push(
        [''],
        [section.title],
        section.headers,
        ...section.rows
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
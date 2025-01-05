import { ExportData } from '@/utils/csv/types';
import { createLicenseSection } from '@/utils/csv/sections/licenseSection';
import { createSandboxSection } from '@/utils/csv/sections/sandboxSection';
import { createLimitsSection } from '@/utils/csv/sections/limitsSection';
import { createUserSection } from '@/utils/csv/sections/userSection';
import { filterStandardSalesforceUsers } from '@/components/users/utils/userFilters';
import { generateSavingsReportContent } from './csv/generators/savingsReportContent';

export const generateReportCSV = async (data: ExportData): Promise<string> => {
  console.log('Starting CSV generation with data:', data);

  // Process users data
  const standardUsers = data.users ? filterStandardSalesforceUsers(data.users) : [];
  
  // Calculate savings breakdown using the data from SavingsCalculator
  const savingsBreakdown = {
    inactiveUserSavings: { savings: 0, count: 0 },
    integrationUserSavings: { savings: 0, count: 0 },
    platformLicenseSavings: { savings: 0, count: 0 },
    sandboxSavings: { savings: 0, count: 0 },
    storageSavings: { savings: 0, potentialGBSavings: 0 },
    totalSavings: 0
  };

  // Generate savings report content
  const csvContent = generateSavingsReportContent({
    licensePrice: data.licensePrice || 0,
    standardUsers,
    savingsBreakdown
  });

  // Create all sections
  const sections = [
    createLicenseSection('User Licenses', data.userLicenses || []),
    createLicenseSection('Package Licenses', data.packageLicenses || []),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses || []),
    createSandboxSection(data.sandboxes || []),
    createLimitsSection(data.limits || {}),
    createUserSection('Inactive Users', []),
    createUserSection('Integration User Candidates', []),
    createUserSection('Platform License Candidates', [])
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
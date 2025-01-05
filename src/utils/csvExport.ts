import { ExportData } from '@/utils/csv/types';
import { createLicenseSection } from '@/utils/csv/sections/licenseSection';
import { createSandboxSection } from '@/utils/csv/sections/sandboxSection';
import { createLimitsSection } from '@/utils/csv/sections/limitsSection';
import { filterStandardSalesforceUsers } from '@/components/users/utils/userFilters';
import { generateSavingsReportContent } from '@/utils/csv/generators/savingsReportContent';

export const generateReportCSV = async (data: ExportData): Promise<string> => {
  console.log('CSV Export - Initial Data:', {
    licensePrice: data.licensePrice,
    users: data.users?.length,
    standardUsers: data.users ? filterStandardSalesforceUsers(data.users).length : 0
  });

  // Process users data
  const standardUsers = data.users ? filterStandardSalesforceUsers(data.users) : [];
  const standardUserCount = standardUsers.length;
  
  // Calculate savings
  const savingsBreakdown = {
    inactiveUserSavings: { 
      savings: data.inactiveUserSavings || 0, 
      count: data.inactiveUserCount || 0 
    },
    integrationUserSavings: { 
      savings: data.integrationUserSavings || 0, 
      count: data.integrationUserCount || 0 
    },
    platformLicenseSavings: { 
      savings: data.platformLicenseSavings || 0, 
      count: data.platformLicenseCount || 0 
    },
    sandboxSavings: { 
      savings: data.sandboxSavings || 0, 
      count: data.excessSandboxCount || 0 
    },
    storageSavings: { 
      savings: data.storageSavings || 0, 
      potentialGBSavings: data.potentialStorageReduction || 0 
    },
    totalSavings: (data.inactiveUserSavings || 0) +
                 (data.integrationUserSavings || 0) +
                 (data.platformLicenseSavings || 0) +
                 (data.sandboxSavings || 0) +
                 (data.storageSavings || 0)
  };

  console.log('CSV Export - Savings Breakdown:', JSON.stringify(savingsBreakdown, null, 2));

  // Generate savings report content with actual license price
  const csvContent = generateSavingsReportContent({
    licensePrice: data.licensePrice || 140,
    standardUsers: standardUserCount,
    savingsBreakdown
  });

  // Create sections without unnecessary logging
  const sections = [
    createLicenseSection('User Licenses', data.userLicenses),
    createLicenseSection('Package Licenses', data.packageLicenses),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses),
    createSandboxSection(data.sandboxes),
    createLimitsSection(data.limits)
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
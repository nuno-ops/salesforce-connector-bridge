import { ExportData, CsvSection } from './types';
import { createLicenseSection } from './sections/licenseSection';
import { createUserSection } from './sections/userSection';
import { createSandboxSection } from './sections/sandboxSection';
import { createLimitsSection } from './sections/limitsSection';
import { filterInactiveUsers, filterStandardSalesforceUsers } from "@/components/users/utils/userFilters";
import { analyzeIntegrationOpportunities } from "@/components/cost-savings/utils/licenseCalculations";

export const generateReportCSV = (data: ExportData) => {
  console.log('Generating CSV with raw data:', data);

  const standardUsers = data.users ? filterStandardSalesforceUsers(data.users) : [];
  const inactiveUsers = filterInactiveUsers(standardUsers);
  const potentialIntegrationUsers = analyzeIntegrationOpportunities(
    standardUsers,
    data.oauthTokens || [],
    inactiveUsers
  );

  const sections: CsvSection[] = [
    createLicenseSection('User Licenses', data.userLicenses),
    createLicenseSection('Package Licenses', data.packageLicenses),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses),
    createUserSection('Inactive Users', inactiveUsers),
    createUserSection('Integration User Candidates', potentialIntegrationUsers),
    createSandboxSection(data.sandboxes),
    createLimitsSection(data.limits)
  ];

  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
  ];

  sections.forEach(section => {
    csvContent.push(
      [section.title],
      section.headers,
      ...section.rows,
      ['']
    );
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
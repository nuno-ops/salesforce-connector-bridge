import { ExportData, CSVSection } from './types';
import { createLicenseSection } from './sections/licenseSection';
import { createSandboxSection } from './sections/sandboxSection';
import { createLimitsSection } from './sections/limitsSection';

export const generateReportCSV = (data: ExportData) => {
  console.log('Generating CSV with raw data:', data);

  const sections: CSVSection[] = [
    createLicenseSection('User Licenses', data.userLicenses),
    createLicenseSection('Package Licenses', data.packageLicenses),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses),
    createSandboxSection(data.sandboxes),
    createLimitsSection(data.limits)
  ];

  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    ['']
  ];

  sections.forEach(section => {
    const sectionRows = [
      [section.title],
      section.headers,
      ...section.rows,
      ['']  // Empty row for spacing
    ];
    csvContent.push(...sectionRows);
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
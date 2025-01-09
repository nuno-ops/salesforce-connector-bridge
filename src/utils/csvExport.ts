import { ExportData } from './csv/types';
import { filterStandardSalesforceUsers } from '@/components/users/utils/userFilters';
import { createLicenseSection } from './csv/sections/licenseSection';
import { createSandboxSection } from './csv/sections/sandboxSection';
import { createLimitsSection } from './csv/sections/limitsSection';

export const generateReportCSV = async (data: ExportData): Promise<string> => {
  console.log('CSV Generation - Input data:', {
    userLicenses: data.userLicenses,
    packageLicenses: data.packageLicenses,
    users: data.users,
    oauthTokens: data.oauthTokens,
    licensePrice: data.licensePrice,
    savingsBreakdown: data.savingsBreakdown
  });

  // Process users data
  const standardUsers = data.users ? filterStandardSalesforceUsers(data.users) : [];
  console.log('CSV Generation - Standard users:', {
    totalUsers: data.users?.length,
    standardUsers: standardUsers.length,
    userDetails: standardUsers.map(u => ({
      id: u.Id,
      type: u.UserType,
      profile: u.Profile?.Name
    }))
  });

  const licensePrice = data.licensePrice || 0;

  // Calculate costs
  const totalMonthlyLicenseCost = licensePrice * standardUsers.length;
  const totalAnnualLicenseCost = totalMonthlyLicenseCost * 12;

  console.log('CSV Generation - Cost calculations:', {
    licensePrice,
    standardUsersCount: standardUsers.length,
    totalMonthlyLicenseCost,
    totalAnnualLicenseCost
  });

  // Calculate savings with detailed logging
  const savingsBreakdown = data.savingsBreakdown || [];
  const totalSavings = savingsBreakdown.reduce((acc, curr) => acc + curr.amount, 0);

  console.log('CSV Generation - Savings breakdown:', {
    savingsBreakdown,
    totalSavings,
    breakdownItems: savingsBreakdown.map(item => ({
      title: item.title,
      amount: item.amount,
      details: item.details
    }))
  });

  // Generate CSV content
  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', `$${licensePrice}`],
    ['Total Users:', standardUsers.length.toString()],
    ['Total Monthly License Cost:', `$${totalMonthlyLicenseCost.toLocaleString()}`],
    ['Total Annual License Cost:', `$${totalAnnualLicenseCost.toLocaleString()}`],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', `$${totalSavings.toLocaleString()}`],
    ['Percentage of Annual Cost:', `${totalAnnualLicenseCost > 0 ? ((totalSavings / totalAnnualLicenseCost) * 100).toFixed(1) : '0.0'}%`],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details', 'Percentage of Total Savings'],
    ...savingsBreakdown.map(item => [
      item.title,
      `$${item.amount.toLocaleString()}`,
      `$${(item.amount / 12).toLocaleString()}`,
      item.details,
      `${totalSavings > 0 ? ((item.amount / totalSavings) * 100).toFixed(1) : '0.0'}%`
    ])
  ];

  // Add sections
  const sections = [
    createLicenseSection('User Licenses', data.userLicenses || []),
    createLicenseSection('Package Licenses', data.packageLicenses || []),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses || []),
    createSandboxSection(data.sandboxes || []),
    createLimitsSection(data.limits || null)
  ];

  console.log('CSV Generation - Sections created:', {
    sectionCount: sections.length,
    sectionTypes: sections.map(s => s.title)
  });

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

  console.log('CSV Generation - Final content structure:', {
    totalRows: csvContent.length,
    sections: sections.map(s => ({
      title: s.title,
      rowCount: s.rows.length
    }))
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
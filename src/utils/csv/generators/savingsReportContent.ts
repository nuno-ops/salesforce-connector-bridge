import { ExportData } from '../types';

export const generateSavingsReportContent = ({
  licensePrice,
  standardUsers,
  savingsBreakdown,
  userLicenses,
  packageLicenses,
  sandboxes,
  limits,
  storageUsage
}: ExportData): string[][] => {
  console.log('Generating savings report with data:', {
    licensePrice,
    standardUsersCount: standardUsers?.length,
    breakdownItems: savingsBreakdown?.length,
    userLicensesCount: userLicenses?.length,
    packageLicensesCount: packageLicenses?.length,
    sandboxesCount: sandboxes?.length,
    hasLimits: !!limits,
    storageUsage
  });

  // Helper function to format currency values consistently without commas
  const formatCurrency = (value: number): string => {
    if (!value) return '$0';
    return `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
  };

  // Calculate total savings
  const totalSavings = savingsBreakdown?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const totalMonthlyLicenseCost = (licensePrice || 0) * (standardUsers?.length || 0);
  const totalAnnualLicenseCost = totalMonthlyLicenseCost * 12;

  // Generate the CSV content
  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', formatCurrency(licensePrice || 0)],
    ['Total Users:', (standardUsers?.length || 0).toString()],
    ['Total Monthly License Cost:', formatCurrency(totalMonthlyLicenseCost)],
    ['Total Annual License Cost:', formatCurrency(totalAnnualLicenseCost)],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', formatCurrency(totalSavings)],
    ['Percentage of Annual Cost:', totalAnnualLicenseCost > 0 ? 
      `${((totalSavings / totalAnnualLicenseCost) * 100).toFixed(1)}%` : '0%'],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details', 'Percentage of Total Savings']
  ];

  // Add each savings category
  savingsBreakdown?.forEach(item => {
    const monthlySavings = (item.amount || 0) / 12;
    const percentageOfTotal = totalSavings > 0 ? 
      ((item.amount || 0) / totalSavings * 100).toFixed(1) : '0.0';

    csvContent.push([
      item.title,
      formatCurrency(item.amount || 0),
      formatCurrency(monthlySavings),
      item.details,
      `${percentageOfTotal}%`
    ]);
  });

  // Add License Details section
  if (userLicenses?.length > 0) {
    csvContent.push(
      [''],
      ['User License Details'],
      ['License Name', 'Total', 'Used', 'Available', 'Usage %']
    );

    userLicenses.forEach(license => {
      const total = license.TotalLicenses || 0;
      const used = license.UsedLicenses || 0;
      const available = total - used;
      const usagePercentage = total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';

      csvContent.push([
        license.Name || 'Unknown',
        total.toString(),
        used.toString(),
        available.toString(),
        `${usagePercentage}%`
      ]);
    });
  }

  // Add Package License Details
  if (packageLicenses?.length > 0) {
    csvContent.push(
      [''],
      ['Package License Details'],
      ['Package Name', 'Total', 'Used', 'Available', 'Usage %', 'Status']
    );

    packageLicenses.forEach(pkg => {
      const total = pkg.TotalLicenses || pkg.AllowedLicenses || 0;
      const used = pkg.UsedLicenses || 0;
      const available = total - used;
      const usagePercentage = total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';

      csvContent.push([
        pkg.Name || pkg.NamespacePrefix || 'Unknown',
        total.toString(),
        used.toString(),
        available.toString(),
        `${usagePercentage}%`,
        pkg.Status || 'Unknown'
      ]);
    });
  }

  // Add Sandbox Information
  if (sandboxes?.length > 0) {
    csvContent.push(
      [''],
      ['Sandbox Details'],
      ['Name', 'Type', 'Status']
    );

    sandboxes.forEach(sandbox => {
      csvContent.push([
        sandbox.SandboxName || 'Unknown',
        sandbox.LicenseType || 'Unknown',
        sandbox.Status || 'Unknown'
      ]);
    });
  }

  // Add Storage and Limits Information
  if (limits) {
    csvContent.push(
      [''],
      ['Organization Limits'],
      ['Limit Type', 'Used', 'Total', 'Remaining', 'Usage %']
    );

    if (limits.DataStorageMB) {
      const used = limits.DataStorageMB.Max - (limits.DataStorageMB.Remaining || 0);
      const total = limits.DataStorageMB.Max || 0;
      const remaining = limits.DataStorageMB.Remaining || 0;
      const usagePercentage = total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';

      csvContent.push([
        'Data Storage (MB)',
        used.toString(),
        total.toString(),
        remaining.toString(),
        `${usagePercentage}%`
      ]);
    }

    if (limits.FileStorageMB) {
      const used = limits.FileStorageMB.Max - (limits.FileStorageMB.Remaining || 0);
      const total = limits.FileStorageMB.Max || 0;
      const remaining = limits.FileStorageMB.Remaining || 0;
      const usagePercentage = total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';

      csvContent.push([
        'File Storage (MB)',
        used.toString(),
        total.toString(),
        remaining.toString(),
        `${usagePercentage}%`
      ]);
    }
  }

  return csvContent;
};
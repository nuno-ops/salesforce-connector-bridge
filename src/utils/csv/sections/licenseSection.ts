import { RawLicense, CSVSection } from '../types';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  console.log(`Creating ${title} section with raw license data:`, licenses);
  
  const rows = licenses.map(license => {
    const name = license.name || license.NamespacePrefix || 'Unknown';
    const total = license.total === -1 ? 'Unlimited' : license.total?.toString() || '0';
    const used = license.used?.toString() || '0';
    const available = license.total === -1 ? 'Unlimited' : 
      ((license.total || 0) - (license.used || 0)).toString();
    const usagePercentage = license.total === -1 ? 'N/A' : 
      license.total > 0 ? ((license.used || 0) / license.total * 100).toFixed(1) + '%' : '0%';

    console.log('Processing license:', {
      name,
      total,
      used,
      available,
      usagePercentage,
      rawLicense: license
    });

    return [name, total, used, available, usagePercentage];
  });

  return {
    title,
    headers: ['Name', 'Total Licenses', 'Used Licenses', 'Available Licenses', 'Usage %'],
    rows
  };
};
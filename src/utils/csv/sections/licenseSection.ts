import { RawLicense, CSVSection } from '../types';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  console.log(`Creating ${title} section with raw license data:`, {
    licensesCount: licenses?.length,
    firstLicense: licenses?.[0],
    allLicenses: licenses
  });
  
  const rows = licenses.map(license => {
    // Handle Salesforce's capitalized property names
    const name = license.Name || 
                 license.NamespacePrefix || 
                 license.DeveloperName || 
                 'Unknown';
                 
    const total = license.TotalLicenses || 
                  license.AllowedLicenses || 
                  0;
                  
    const used = license.UsedLicenses || 0;
    
    const available = total === -1 ? 'Unlimited' : (total - used).toString();
    const usagePercentage = total === -1 ? 'N/A' : 
                           (total > 0 ? ((used / total) * 100).toFixed(1) + '%' : '0.0%');

    console.log('Processing license row:', {
      name,
      total,
      used,
      available,
      usagePercentage,
      originalLicense: license
    });

    return [
      name,
      total === -1 ? 'Unlimited' : total.toString(),
      used.toString(),
      available,
      usagePercentage,
      license.Status || 'Active'
    ];
  });

  return {
    title,
    headers: ['Name', 'Total Licenses', 'Used Licenses', 'Available Licenses', 'Usage %', 'Status'],
    rows
  };
};
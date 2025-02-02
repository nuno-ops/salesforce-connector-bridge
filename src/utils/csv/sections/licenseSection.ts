import { RawLicense, CSVSection } from '../types';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  console.log(`Creating ${title} section with raw license data:`, {
    licensesCount: licenses?.length,
    firstLicense: licenses?.[0],
    allLicenses: licenses,
    timestamp: new Date().toISOString()
  });
  
  const rows = licenses.map((license, index) => {
    // Log the raw license data
    console.log(`Processing license ${index}:`, {
      rawLicense: license,
      properties: Object.keys(license),
      values: Object.values(license),
      timestamp: new Date().toISOString()
    });

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

    console.log('Transformed license data:', {
      name,
      total,
      used,
      available,
      usagePercentage,
      originalLicense: license,
      timestamp: new Date().toISOString()
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

  console.log(`${title} section final output:`, {
    rowCount: rows.length,
    sampleRows: rows.slice(0, 2),
    timestamp: new Date().toISOString()
  });

  return {
    title,
    headers: ['Name', 'Total Licenses', 'Used Licenses', 'Available Licenses', 'Usage %', 'Status'],
    rows
  };
};
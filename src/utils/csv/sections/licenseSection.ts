import { RawLicense, CSVSection } from '../types';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  console.log('=== CREATE LICENSE SECTION START ===');
  console.log(`createLicenseSection [${title}] - Input:`, {
    licensesCount: licenses?.length,
    firstLicense: licenses?.[0],
    allLicenses: licenses,
    timestamp: new Date().toISOString()
  });
  
  const rows = licenses.map((license, index) => {
    console.log(`createLicenseSection [${title}] - Processing license ${index}:`, {
      rawLicense: license,
      properties: Object.keys(license),
      values: Object.values(license),
      timestamp: new Date().toISOString()
    });

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

    console.log(`createLicenseSection [${title}] - Transformed license ${index}:`, {
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

  const section = {
    title,
    headers: ['Name', 'Total Licenses', 'Used Licenses', 'Available Licenses', 'Usage %', 'Status'],
    rows
  };

  console.log(`createLicenseSection [${title}] - Final output:`, {
    title: section.title,
    headerCount: section.headers.length,
    rowCount: section.rows.length,
    sampleRow: section.rows[0],
    allRows: section.rows,
    timestamp: new Date().toISOString()
  });
  console.log('=== CREATE LICENSE SECTION END ===');

  return section;
};
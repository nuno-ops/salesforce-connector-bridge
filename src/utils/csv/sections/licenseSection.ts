import { RawLicense, CSVSection } from '../types';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  console.log(`=== CREATE LICENSE SECTION START: ${title} ===`);
  console.log('Input licenses:', licenses);
  
  const rows = licenses.map(license => {
    // Use the existing name property from the formatted license data
    const name = license.name || license.NamespacePrefix || license.Name || 'Unknown';
    // Use the existing total and used values
    const total = license.total || license.TotalLicenses || license.AllowedLicenses || 0;
    const used = license.used || license.UsedLicenses || 0;
    const available = total === -1 ? 'Unlimited' : (total - used).toString();
    const usagePercentage = total === -1 ? 
      '0.0' : 
      ((used / (Number(total) || 1)) * 100).toFixed(1);

    console.log('Processing license:', { name, total, used, available, usagePercentage });

    return [
      name,
      total === -1 ? 'Unlimited' : total.toString(),
      used.toString(),
      available,
      `${usagePercentage}%`,
      license.status || 'Active'
    ];
  });

  console.log(`=== CREATE LICENSE SECTION END: ${title} ===`);
  console.log('Generated rows:', rows.length);

  return {
    title,
    headers: ['Name', 'Total', 'Used', 'Available', 'Usage %', 'Status'],
    rows
  };
};
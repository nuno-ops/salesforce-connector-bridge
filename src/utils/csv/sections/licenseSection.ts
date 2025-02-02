import { RawLicense, CSVSection } from '../types';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  console.log(`=== CREATE LICENSE SECTION START: ${title} ===`);
  console.log('Input licenses:', licenses);
  
  const rows = licenses.map(license => {
    const name = license.Name || 'Unknown';
    const total = license.TotalLicenses === -1 ? 'Unlimited' : license.TotalLicenses;
    const used = license.UsedLicenses || 0;
    const available = total === 'Unlimited' ? 'Unlimited' : (Number(total) - used).toString();
    const usagePercentage = total === 'Unlimited' ? 
      '0.0' : 
      ((used / (Number(total) || 1)) * 100).toFixed(1);

    console.log('Processing license:', { name, total, used, available, usagePercentage });

    return [
      name,
      total.toString(),
      used.toString(),
      available,
      `${usagePercentage}%`,
      license.Status || 'Active'
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
import { RawLicense } from '../types';

export const createLicenseSection = (title: string, licenses: RawLicense[]) => {
  console.log(`Creating ${title} section with raw data:`, licenses);
  
  const rows = licenses.map(license => {
    const name = license.Name || license.NamespacePrefix || license.DeveloperName || 'Unknown';
    const total = license.TotalLicenses || license.AllowedLicenses || 0;
    const used = license.UsedLicenses || 0;
    const available = total === -1 ? 'Unlimited' : (total - used).toString();
    const usagePercentage = total === -1 ? '0.0' : ((used / total) * 100).toFixed(1);

    return [
      name,
      total === -1 ? 'Unlimited' : total.toString(),
      used.toString(),
      available,
      `${usagePercentage}%`,
      license.Status || 'Active'
    ];
  });

  return {
    title,
    headers: ['Name', 'Total', 'Used', 'Available', 'Usage %', 'Status'],
    rows
  };
};
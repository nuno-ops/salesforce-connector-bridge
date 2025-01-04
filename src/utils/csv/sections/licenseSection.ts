import { RawLicense } from '../types';

export const createLicenseSection = (title: string, licenses: RawLicense[]) => {
  console.log(`Creating ${title} section with data:`, licenses);
  
  const rows = licenses.map(license => {
    const available = license.total === -1 ? 'Unlimited' : (license.total - license.used).toString();
    const total = license.total === -1 ? 'Unlimited' : license.total.toString();
    const usagePercentage = license.total === -1 ? '0.0' : 
      ((license.used / license.total) * 100).toFixed(1);

    return [
      license.name || 'Unknown',
      total,
      license.used.toString(),
      available,
      `${usagePercentage}%`,
      license.status || 'Active'
    ];
  });

  return {
    title,
    headers: ['Name', 'Total', 'Used', 'Available', 'Usage %', 'Status'],
    rows
  };
};
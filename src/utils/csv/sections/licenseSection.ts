import { RawLicense, CSVSection } from '../types';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  console.log(`Creating ${title} section with raw data:`, licenses);
  
  return {
    title,
    headers: ['Name', 'Total Licenses', 'Used Licenses', 'Available Licenses', 'Usage %'],
    rows: licenses.map(license => {
      // Handle -1 total licenses as unlimited
      const total = license.TotalLicenses || license.AllowedLicenses || 0;
      const used = license.UsedLicenses || 0;
      const available = total === -1 ? 'Unlimited' : (total - used).toString();
      const usagePercentage = total === -1 ? 'N/A' : 
        total > 0 ? ((used / total) * 100).toFixed(1) + '%' : '0%';

      return [
        license.Name || license.NamespacePrefix || license.DeveloperName || 'Unknown',
        total === -1 ? 'Unlimited' : total.toString(),
        used.toString(),
        available,
        usagePercentage
      ];
    })
  };
};
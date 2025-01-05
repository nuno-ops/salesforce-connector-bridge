import { RawLicense, CSVSection } from '../types';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  console.log(`Creating ${title} section with data:`, licenses);
  
  return {
    title,
    headers: ['Name', 'Total Licenses', 'Used Licenses', 'Available Licenses', 'Usage %'],
    rows: licenses.map(license => {
      const total = license.TotalLicenses || license.AllowedLicenses || 0;
      const used = license.UsedLicenses || 0;
      const available = total - used;
      const usagePercentage = total > 0 ? ((used / total) * 100).toFixed(1) + '%' : 'N/A';

      return [
        license.Name || license.NamespacePrefix || license.DeveloperName || 'Unknown',
        total.toString(),
        used.toString(),
        available.toString(),
        usagePercentage
      ];
    })
  };
};
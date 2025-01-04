import { RawLicense, CSVSection, License } from '../types';
import { formatLicense } from '../formatters';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  const formattedLicenses = licenses.map(formatLicense);
  
  return {
    title,
    headers: ['Name', 'Total Licenses', 'Used Licenses', 'Available Licenses', 'Usage %'],
    rows: formattedLicenses.map(license => {
      const available = license.total - license.used;
      const usagePercentage = license.total > 0 ? ((license.used / license.total) * 100).toFixed(1) + '%' : 'N/A';

      return [
        license.name,
        license.total.toString(),
        license.used.toString(),
        available.toString(),
        usagePercentage
      ];
    })
  };
};
import { RawLicense, CSVSection } from '../types';
import { 
  getLicenseName, 
  getLicenseTotal, 
  getLicenseUsed, 
  getLicenseStatus 
} from '../formatters';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  console.log(`Creating ${title} section with raw license data:`, licenses);
  
  const rows = licenses.map(license => {
    const name = getLicenseName(license);
    const total = getLicenseTotal(license);
    const used = getLicenseUsed(license);
    const available = total === -1 ? 'Unlimited' : (total - used).toString();
    const usagePercentage = total === -1 ? 'N/A' : (total > 0 ? ((used / total) * 100).toFixed(1) + '%' : '0%');

    return [
      name,
      total === -1 ? 'Unlimited' : total.toString(),
      used.toString(),
      available,
      usagePercentage,
      getLicenseStatus(license)
    ];
  });

  return {
    title,
    headers: ['Name', 'Total Licenses', 'Used Licenses', 'Available Licenses', 'Usage %', 'Status'],
    rows
  };
};
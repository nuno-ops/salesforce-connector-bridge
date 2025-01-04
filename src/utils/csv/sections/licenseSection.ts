import { RawLicense } from '../types';
import { 
  getLicenseName, 
  getLicenseTotal, 
  getLicenseUsed, 
  getLicenseStatus,
  calculateUsagePercentage 
} from '../formatters';

export const createLicenseSection = (title: string, licenses: RawLicense[]) => {
  console.log(`Creating ${title} section with raw data:`, licenses);
  
  const rows = licenses.map(license => {
    const name = getLicenseName(license);
    const total = getLicenseTotal(license);
    const used = getLicenseUsed(license);
    const available = total === -1 ? 'Unlimited' : (total - used).toString();
    const usagePercentage = calculateUsagePercentage(used, total);

    return [
      name,
      total === -1 ? 'Unlimited' : total.toString(),
      used.toString(),
      available,
      `${usagePercentage}%`,
      getLicenseStatus(license)
    ];
  });

  return {
    title,
    headers: ['Name', 'Total', 'Used', 'Available', 'Usage %', 'Status'],
    rows
  };
};
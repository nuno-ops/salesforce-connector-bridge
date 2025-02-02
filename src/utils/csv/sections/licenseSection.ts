import { RawLicense, CSVSection } from '../types';
import { 
  getLicenseName, 
  getLicenseTotal, 
  getLicenseUsed, 
  getLicenseStatus,
  calculateUsagePercentage 
} from '../formatters';

export const createLicenseSection = (title: string, licenses: RawLicense[]): CSVSection => {
  console.log(`=== CREATE LICENSE SECTION START: ${title} ===`);
  console.log('Input licenses:', licenses);
  
  const rows = licenses.map(license => {
    const name = getLicenseName(license);
    const total = getLicenseTotal(license);
    const used = getLicenseUsed(license);
    const available = total === -1 ? 'Unlimited' : (total - used).toString();
    const usagePercentage = calculateUsagePercentage(used, total);

    console.log('Processing license:', { name, total, used, available, usagePercentage });

    return [
      name,
      total === -1 ? 'Unlimited' : total.toString(),
      used.toString(),
      available,
      `${usagePercentage}%`,
      getLicenseStatus(license)
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
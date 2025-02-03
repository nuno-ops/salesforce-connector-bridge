import { RawLicense, CSVSection } from "@/utils/csv/types";
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

  const headers = ['Name', 'Total Licenses', 'Used Licenses', 'Available', 'Usage %'];
  const rows: string[][] = [];

  licenses.forEach(license => {
    console.log('Processing license:', license);
    
    const name = getLicenseName(license);
    const total = getLicenseTotal(license);
    const used = getLicenseUsed(license);
    const available = String(total - used);
    const usagePercentage = calculateUsagePercentage(used, total);

    rows.push([
      name,
      String(total),
      String(used),
      available,
      `${usagePercentage}%`
    ]);
  });

  console.log(`=== CREATE LICENSE SECTION END: ${title} ===`);
  console.log('Generated rows:', rows.length);

  return {
    title,
    headers,
    rows
  };
};
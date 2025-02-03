import { RawLicense, FormattedLicense, CSVSection } from "../types";

const isFormattedLicense = (license: any): license is FormattedLicense => {
  return 'name' in license && 'total' in license && 'used' in license;
};

const getName = (license: RawLicense | FormattedLicense): string => {
  if (isFormattedLicense(license)) {
    return license.name || 'Unknown';
  }
  return license.Name || license.NamespacePrefix || license.DeveloperName || 'Unknown';
};

const getTotal = (license: RawLicense | FormattedLicense): number => {
  if (isFormattedLicense(license)) {
    return license.total;
  }
  return license.TotalLicenses || license.AllowedLicenses || 0;
};

const getUsed = (license: RawLicense | FormattedLicense): number => {
  if (isFormattedLicense(license)) {
    return license.used;
  }
  return license.UsedLicenses || 0;
};

const getStatus = (license: RawLicense | FormattedLicense): string => {
  if (isFormattedLicense(license)) {
    return license.status || 'Active';
  }
  return license.Status || 'Active';
};

const calculateUsagePercentage = (used: number, total: number): string => {
  if (total === 0 || total === -1) return '0.0';
  return ((used / total) * 100).toFixed(1);
};

export const createLicenseSection = (title: string, licenses: (RawLicense | FormattedLicense)[]): CSVSection => {
  console.log(`=== CREATE LICENSE SECTION START: ${title} ===`);
  console.log('Input licenses:', licenses);

  const rows = licenses.map(license => {
    console.log('Processing license:', license);
    
    const name = getName(license);
    const total = getTotal(license);
    const used = getUsed(license);
    const available = total === -1 ? 'Unlimited' : String(total - used);
    const usagePercentage = calculateUsagePercentage(used, total);

    const row = [
      name,
      total === -1 ? 'Unlimited' : String(total),
      String(used),
      available,
      `${usagePercentage}%`
    ];

    console.log('Generated row:', row);
    return row;
  });

  console.log(`=== CREATE LICENSE SECTION END: ${title} ===`);
  console.log('Generated rows:', rows.length);

  return {
    title,
    headers: ['Name', 'Total Licenses', 'Used Licenses', 'Available', 'Usage %'],
    rows
  };
};
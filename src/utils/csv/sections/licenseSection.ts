import { RawLicense } from "@/utils/csv/types";

export const createLicenseSection = (title: string, licenses: RawLicense[]): string[][] => {
  console.log(`=== CREATE LICENSE SECTION START: ${title} ===`);
  console.log('Input licenses:', licenses);

  const header = [
    [''],
    [title],
    ['Name', 'Total Licenses', 'Used Licenses', 'Available', 'Usage %']
  ];

  const rows = licenses.map(license => {
    console.log('Processing license:', license);
    
    const name = license.Name || license.NamespacePrefix || 'Unknown';
    const total = Number(license.TotalLicenses || license.AllowedLicenses || 0);
    const used = Number(license.UsedLicenses || 0);
    const available = String(total - used);
    const usagePercentage = total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';

    return [
      name,
      String(total),
      String(used),
      available,
      `${usagePercentage}%`
    ];
  });

  console.log(`=== CREATE LICENSE SECTION END: ${title} ===`);
  console.log('Generated rows:', rows.length);

  return [...header, ...rows, ['']];
};
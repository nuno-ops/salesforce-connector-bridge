import { generateSavingsReportContent } from './generators/savingsReportContent';
import { formatCurrency, formatPercentage } from './formatters';
import { ExportData } from './types';

export const generateCSVContent = async (data: ExportData): Promise<string> => {
  console.log('CSV Export - Starting generation with data:', {
    hasUsers: !!data.users?.length,
    hasLicenses: !!data.userLicenses?.length,
    hasSavingsBreakdown: !!data.savingsBreakdown?.length,
    licensePrice: data.licensePrice,
    timestamp: new Date().toISOString()
  });

  const savingsContent = await generateSavingsReportContent(data);
  
  // Convert the content to CSV string format
  const csvRows = [
    ...savingsContent.header.map(h => `"${h}"`),
    '',  // Empty row for spacing
    ...savingsContent.rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ];

  return csvRows.join('\n');
};
export const formatNumber = (value: any): number => {
  if (value === -1) return 0; // Handle unlimited licenses
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const calculateUsagePercentage = (used: number, total: number): string => {
  if (total === 0) return '0.0';
  return ((used / total) * 100).toFixed(1);
};

export const formatLicenseData = (license: any) => {
  console.log('Formatting license:', license);
  
  // Get the name from the appropriate field
  const name = license.name || 'Unknown';
  
  // Get total and used values
  const total = formatNumber(license.total);
  const used = formatNumber(license.used);
  
  // Calculate available licenses
  const available = total - used;
  
  // Calculate usage percentage
  const usagePercentage = calculateUsagePercentage(used, total);
  
  const formatted = {
    name,
    total,
    used,
    available,
    usagePercentage,
    status: license.status || 'Active'
  };
  
  console.log('Formatted license data:', formatted);
  return formatted;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
export const createLimitsSection = (limits: any) => {
  console.log('Creating limits section with data:', limits);
  
  const calculateUsage = (used: number, max: number) => {
    if (!max) return '0.0';
    return ((used / max) * 100).toFixed(1);
  };

  const formatRow = (name: string, metrics: any) => {
    const used = metrics?.Used || 0;
    const max = metrics?.Max || 0;
    const remaining = metrics?.Remaining || 0;
    const usage = calculateUsage(used, max);

    return [name, used.toString(), max.toString(), remaining.toString(), `${usage}%`];
  };

  return {
    title: 'Organization Limits',
    headers: ['Limit Type', 'Used', 'Total', 'Remaining', 'Usage %'],
    rows: [
      formatRow('Data Storage (MB)', limits?.DataStorageMB),
      formatRow('File Storage (MB)', limits?.FileStorageMB),
      formatRow('Daily API Requests', limits?.DailyApiRequests)
    ]
  };
};
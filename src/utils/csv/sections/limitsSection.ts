export const createLimitsSection = (limits: any) => {
  console.log('Creating limits section with data:', limits);
  
  const calculateUsage = (used: number, max: number) => {
    if (!max) return '0.0';
    return ((used / max) * 100).toFixed(1);
  };

  const formatRow = (name: string, metrics: any) => {
    if (!metrics) return [name, '0', '0', '0', '0.0%'];
    
    const used = metrics.Used || 0;
    const max = metrics.Max || 0;
    const remaining = metrics.Remaining || 0;
    const usage = calculateUsage(used, max);

    return [
      name,
      used.toString(),
      max.toString(),
      remaining.toString(),
      `${usage}%`
    ];
  };

  const rows = [];
  
  if (limits.DataStorageMB) {
    rows.push(formatRow('Data Storage (MB)', {
      Used: limits.DataStorageMB.Max - limits.DataStorageMB.Remaining,
      Max: limits.DataStorageMB.Max,
      Remaining: limits.DataStorageMB.Remaining
    }));
  }
  
  if (limits.FileStorageMB) {
    rows.push(formatRow('File Storage (MB)', {
      Used: limits.FileStorageMB.Max - limits.FileStorageMB.Remaining,
      Max: limits.FileStorageMB.Max,
      Remaining: limits.FileStorageMB.Remaining
    }));
  }
  
  if (limits.DailyApiRequests) {
    rows.push(formatRow('Daily API Requests', {
      Used: limits.DailyApiRequests.Max - limits.DailyApiRequests.Remaining,
      Max: limits.DailyApiRequests.Max,
      Remaining: limits.DailyApiRequests.Remaining
    }));
  }

  return {
    title: 'Organization Limits',
    headers: ['Limit Type', 'Used', 'Total', 'Remaining', 'Usage %'],
    rows
  };
};
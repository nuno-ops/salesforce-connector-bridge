import { CSVSection } from '../types';

export const createLimitsSection = (limits: any): CSVSection => {
  const limitRows = [];
  
  // Handle Data Storage
  if (limits.DataStorageMB) {
    const used = limits.DataStorageMB.Used || 0;
    const max = limits.DataStorageMB.Max || 0;
    const remaining = limits.DataStorageMB.Remaining || 0;
    const usagePercentage = max > 0 ? ((used / max) * 100).toFixed(2) + '%' : '0%';
    
    limitRows.push([
      'Data Storage (MB)',
      used.toString(),
      max.toString(),
      remaining.toString(),
      usagePercentage
    ]);
  }

  // Handle File Storage
  if (limits.FileStorageMB) {
    const used = limits.FileStorageMB.Used || 0;
    const max = limits.FileStorageMB.Max || 0;
    const remaining = limits.FileStorageMB.Remaining || 0;
    const usagePercentage = max > 0 ? ((used / max) * 100).toFixed(2) + '%' : '0%';
    
    limitRows.push([
      'File Storage (MB)',
      used.toString(),
      max.toString(),
      remaining.toString(),
      usagePercentage
    ]);
  }

  // Handle API Requests
  if (limits.DailyApiRequests) {
    const used = limits.DailyApiRequests.Used || 0;
    const max = limits.DailyApiRequests.Max || 0;
    const remaining = limits.DailyApiRequests.Remaining || 0;
    const usagePercentage = max > 0 ? ((used / max) * 100).toFixed(2) + '%' : '0%';
    
    limitRows.push([
      'Daily API Requests',
      used.toString(),
      max.toString(),
      remaining.toString(),
      usagePercentage
    ]);
  }

  return {
    title: 'Organization Limits',
    headers: ['Limit Type', 'Used', 'Total', 'Remaining', 'Usage %'],
    rows: limitRows
  };
};
import { format, subMonths } from 'date-fns';

interface SalesforceMetric {
  Month: number;
  Year: number;
  TotalLeads?: number;
  ConvertedLeads?: number;
  TotalOpps?: number;
  WonOpps?: number;
}

export const calculateMonthlyMetrics = (metrics: { leads: SalesforceMetric[], opportunities: SalesforceMetric[] } | null) => {
  if (!metrics) return { leadConversion: [], oppWinRate: [] };

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, i);
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      date: date
    };
  });

  const monthlyLeadMetrics = months.map(({ month, year, date }) => {
    const monthData = metrics.leads.find(m => m.Month === month && m.Year === year);
    
    const totalLeads = monthData?.TotalLeads || 0;
    const convertedLeads = monthData?.ConvertedLeads || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      month: format(date, 'MMM yy'),
      value: Math.round(conversionRate * 10) / 10
    };
  }).reverse();

  const monthlyOppMetrics = months.map(({ month, year, date }) => {
    const monthData = metrics.opportunities.find(m => m.Month === month && m.Year === year);
    
    const totalOpps = monthData?.TotalOpps || 0;
    const wonOpps = monthData?.WonOpps || 0;
    const winRate = totalOpps > 0 ? (wonOpps / totalOpps) * 100 : 0;

    return {
      month: format(date, 'MMM yy'),
      value: Math.round(winRate * 10) / 10
    };
  }).reverse();

  return {
    leadConversion: monthlyLeadMetrics,
    oppWinRate: monthlyOppMetrics
  };
};
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { MonthlyMetrics } from './types';

export const calculateMonthlyMetrics = (metrics: MonthlyMetrics | null) => {
  if (!metrics) return { leadConversion: [], oppWinRate: [] };

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => subMonths(now, i));

  console.log('Processing metrics for months:', months.map(m => format(m, 'MMM yy')));
  console.log('Total leads available:', metrics.leads.length);
  console.log('Sample lead dates:', metrics.leads.slice(0, 3).map(lead => lead.CreatedDate));

  const monthlyLeadMetrics = months.map(month => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    
    const monthLeads = metrics.leads.filter(lead => {
      const createdDate = new Date(lead.CreatedDate);
      console.log('Lead date comparison:', {
        leadDate: format(createdDate, 'yyyy-MM-dd'),
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        isInRange: createdDate >= start && createdDate <= end
      });
      return createdDate >= start && createdDate <= end;
    });

    const totalLeads = monthLeads.length;
    const convertedLeads = monthLeads.filter(lead => lead.IsConverted).length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    console.log('Month metrics:', {
      month: format(month, 'MMM yy'),
      totalLeads,
      convertedLeads,
      conversionRate
    });

    return {
      month: format(month, 'MMM yy'),
      value: Math.round(conversionRate * 10) / 10
    };
  }).reverse();

  const monthlyOppMetrics = months.map(month => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    
    const monthOpps = metrics.opportunities.filter(opp => {
      const closeDate = new Date(opp.CloseDate);
      return closeDate >= start && closeDate <= end;
    });

    const closedOpps = monthOpps.filter(opp => opp.IsClosed).length;
    const wonOpps = monthOpps.filter(opp => opp.IsWon).length;
    const winRate = closedOpps > 0 ? (wonOpps / closedOpps) * 100 : 0;

    return {
      month: format(month, 'MMM yy'),
      value: Math.round(winRate * 10) / 10
    };
  }).reverse();

  return {
    leadConversion: monthlyLeadMetrics,
    oppWinRate: monthlyOppMetrics
  };
};
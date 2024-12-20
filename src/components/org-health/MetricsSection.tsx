import { MetricsCard } from './MetricsCard';
import { calculateMonthlyMetrics } from './MetricsCalculator';

interface MetricsSectionProps {
  metrics: any;
}

export const MetricsSection = ({ metrics }: MetricsSectionProps) => {
  const { leadConversion, oppWinRate } = calculateMonthlyMetrics(metrics);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MetricsCard 
        title="Lead Conversion Rate (Last 6 Months)" 
        subtitle="Based on Lead Created Date. Formula: (Converted Leads / Total Leads) × 100%"
        data={leadConversion}
        valueLabel="Conversion Rate"
      />
      <MetricsCard 
        title="Opportunity Win Rate (Last 6 Months)" 
        subtitle="Based on Opportunity Close Date. Formula: (Won Opportunities / Total Closed Opportunities) × 100%"
        data={oppWinRate}
        valueLabel="Win Rate"
      />
    </div>
  );
};
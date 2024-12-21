import { useState } from 'react';
import { MetricsCard } from './MetricsCard';
import { calculateMonthlyMetrics } from './MetricsCalculator';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

interface MetricsSectionProps {
  metrics: any;
}

export const MetricsSection = ({ metrics }: MetricsSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { leadConversion, oppWinRate } = calculateMonthlyMetrics(metrics);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Operational Metrics</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8"
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
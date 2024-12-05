import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MonthlyMetric {
  month: string;
  value: number;
}

interface MetricsCardProps {
  title: string;
  data: MonthlyMetric[];
  valueLabel: string;
}

export const MetricsCard = ({ title, data, valueLabel }: MetricsCardProps) => {
  const config = {
    metric: {
      color: "#2563eb",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ChartContainer config={config}>
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <CartesianGrid strokeDasharray="3 3" />
              <Bar dataKey="value" name={valueLabel} fill="var(--color-metric)" />
              <ChartTooltip />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsProps {
  leadConversion: Array<{ month: string; value: number }>;
  oppWinRate: Array<{ month: string; value: number }>;
}

export const OperationalMetricsSection = ({ leadConversion, oppWinRate }: MetricsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Lead Conversion Rate */}
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Lead Conversion Rate (Last 6 Months)</h3>
            <div className="space-y-2">
              {leadConversion.map((data, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{data.month}</span>
                  <span>{data.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunity Win Rate */}
          <div className="border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Opportunity Win Rate (Last 6 Months)</h3>
            <div className="space-y-2">
              {oppWinRate.map((data, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{data.month}</span>
                  <span>{data.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
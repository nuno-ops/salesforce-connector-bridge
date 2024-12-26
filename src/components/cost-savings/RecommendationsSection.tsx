import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, AlertCircle } from "lucide-react";

interface RecommendationItem {
  title: string;
  amount: number;
  details: string;
}

interface RecommendationsSectionProps {
  items: RecommendationItem[];
}

export const RecommendationsSection = ({ items }: RecommendationsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Recommendations
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items
          .filter(item => item.amount > 0)
          .map((item, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-2xl font-bold text-sf-blue">
                    ${item.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">{item.details}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <AlertCircle className="h-4 w-4" />
                    2-3 weeks to implement
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};
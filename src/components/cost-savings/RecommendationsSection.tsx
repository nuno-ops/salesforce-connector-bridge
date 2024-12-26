import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecommendationItem {
  title: string;
  amount: number;
  details: string;
  viewAction?: () => void;
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
                  {item.viewAction && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={item.viewAction}
                      className="w-full mt-2"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};
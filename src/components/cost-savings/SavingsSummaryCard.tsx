import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface SavingsSummaryProps {
  totalSavings: number;
  breakdownItems: {
    title: string;
    amount: number;
    details: string;
  }[];
}

export const SavingsSummaryCard = ({ totalSavings, breakdownItems }: SavingsSummaryProps) => {
  return (
    <Card className="bg-gradient-to-r from-sf-blue to-sf-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Potential Annual Savings
            </h2>
            <p className="text-4xl font-bold text-white">
              ${totalSavings.toLocaleString()}
            </p>
          </div>
          <DollarSign className="h-12 w-12 text-white opacity-75" />
        </div>
        <div className="mt-4 space-y-2">
          {breakdownItems.map((item, index) => (
            item.amount > 0 && (
              <div key={index} className="text-white/90">
                <div className="flex justify-between items-center">
                  <span>{item.title}</span>
                  <span>${item.amount.toLocaleString()}</span>
                </div>
                <p className="text-sm text-white/70">{item.details}</p>
              </div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
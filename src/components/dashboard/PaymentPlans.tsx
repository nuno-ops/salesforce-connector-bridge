import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText } from "lucide-react";

interface PaymentPlansProps {
  onSubscribe: (priceId: string) => void;
}

export const PaymentPlans = ({ onSubscribe }: PaymentPlansProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600">Select the plan that best fits your needs</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-sf-blue" />
            <h3 className="text-xl font-semibold">Monthly Subscription</h3>
          </div>
          <p className="text-gray-600">Unlimited access to your dashboard and reports for a full month</p>
          <Button 
            className="w-full bg-sf-blue hover:bg-sf-hover"
            onClick={() => onSubscribe('price_1QcpLNBqwIrd79CSxQ5cNF4M')}
          >
            Subscribe Monthly
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-sf-blue" />
            <h3 className="text-xl font-semibold">One-Time Report</h3>
          </div>
          <p className="text-gray-600">Get a one-time comprehensive report of your Salesforce organization</p>
          <Button 
            className="w-full bg-sf-blue hover:bg-sf-hover"
            onClick={() => onSubscribe('price_1QcpL9BqwIrd79CS00DpeBgL')}
          >
            Purchase Report
          </Button>
        </Card>
      </div>
    </div>
  );
};
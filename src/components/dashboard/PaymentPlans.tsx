import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, Check } from "lucide-react";

interface PaymentPlansProps {
  onSubscribe: (priceId: string) => void;
}

export const PaymentPlans = ({ onSubscribe }: PaymentPlansProps) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="text-gray-600 text-lg">Select the plan that best fits your needs</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Savings Monitor Card */}
        <Card className="p-8 space-y-6 hover:shadow-lg transition-shadow">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-sf-blue" />
              <h3 className="text-2xl font-semibold">Savings Monitor</h3>
            </div>
            <p className="text-gray-600">
              Perfect for businesses seeking ongoing insights and continuous savings opportunities. 
              Monitor your Salesforce organization and uncover new ways to save every month.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-2 text-gray-700">
              <Check className="h-5 w-5 text-sf-blue mt-1 shrink-0" />
              <p><span className="font-semibold">Unlimited Access:</span> View your savings dashboard and reports anytime throughout the subscription period.</p>
            </div>
            <div className="flex items-start space-x-2 text-gray-700">
              <Check className="h-5 w-5 text-sf-blue mt-1 shrink-0" />
              <p><span className="font-semibold">Ongoing Updates:</span> Stay updated with the latest cost-saving insights as your Salesforce organization evolves.</p>
            </div>
            <div className="flex items-start space-x-2 text-gray-700">
              <Check className="h-5 w-5 text-sf-blue mt-1 shrink-0" />
              <p><span className="font-semibold">Continuous Savings Opportunities:</span> Get alerts for new opportunities to optimize licenses, storage, or contracts (coming soon).</p>
            </div>
            <div className="flex items-start space-x-2 text-gray-700">
              <Check className="h-5 w-5 text-sf-blue mt-1 shrink-0" />
              <p><span className="font-semibold">Flexible Cancellation:</span> Cancel anytime after the first month if you no longer need the service.</p>
            </div>
            <div className="flex items-start space-x-2 text-gray-700">
              <Check className="h-5 w-5 text-sf-blue mt-1 shrink-0" />
              <p><span className="font-semibold">Free Consultation:</span> Includes a complimentary consultation call.</p>
            </div>
          </div>

          <Button 
            className="w-full bg-sf-blue hover:bg-sf-hover text-lg py-6"
            onClick={() => onSubscribe('price_1QcpLNBqwIrd79CSxQ5cNF4M')}
          >
            Subscribe Monthly
          </Button>
        </Card>

        {/* Savings Snapshot Card */}
        <Card className="p-8 space-y-6 hover:shadow-lg transition-shadow">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-sf-blue" />
              <h3 className="text-2xl font-semibold">Savings Snapshot</h3>
            </div>
            <p className="text-gray-600">
              Best for businesses that want immediate results without a long-term commitment. 
              Get a full, detailed analysis of your savings potential with no strings attached.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-2 text-gray-700">
              <Check className="h-5 w-5 text-sf-blue mt-1 shrink-0" />
              <p><span className="font-semibold">One-Time Investment:</span> Pay once and get a detailed, actionable report on your Salesforce savings.</p>
            </div>
            <div className="flex items-start space-x-2 text-gray-700">
              <Check className="h-5 w-5 text-sf-blue mt-1 shrink-0" />
              <p><span className="font-semibold">Immediate ROI:</span> Gain instant clarity on where you can save, without committing to a subscription.</p>
            </div>
            <div className="flex items-start space-x-2 text-gray-700">
              <Check className="h-5 w-5 text-sf-blue mt-1 shrink-0" />
              <p><span className="font-semibold">Downloadable Report:</span> Access and share the comprehensive savings analysis with your team.</p>
            </div>
            <div className="flex items-start space-x-2 text-gray-700">
              <Check className="h-5 w-5 text-sf-blue mt-1 shrink-0" />
              <p><span className="font-semibold">Perfect for Quick Wins:</span> Ideal for organizations needing immediate insights without ongoing monitoring.</p>
            </div>
          </div>

          <Button 
            className="w-full bg-sf-blue hover:bg-sf-hover text-lg py-6"
            onClick={() => onSubscribe('price_1QcpL9BqwIrd79CS00DpeBgL')}
          >
            Purchase Report
          </Button>
        </Card>
      </div>
    </div>
  );
};
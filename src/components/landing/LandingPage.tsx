import { Button } from "@/components/ui/button";
import { ChartBar, DollarSign, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sf-light to-white p-4">
      <div className="max-w-4xl mx-auto text-center space-y-12 animate-fadeIn">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-sf-blue to-purple-600 bg-clip-text text-transparent">
            Optimize Your Salesforce Costs
          </h1>
          <p className="text-lg md:text-xl text-sf-gray max-w-2xl mx-auto">
            Discover insights, reduce waste, and maximize your Salesforce investment with our powerful optimization dashboard.
          </p>
        </div>

        {/* Savings Preview */}
        <div className="py-8">
          <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-t-4 border-t-sf-blue">
            <p className="text-2xl font-semibold text-sf-blue mb-4">
              Potential Cost Savings
            </p>
            <div className="text-4xl font-bold text-sf-blue mb-4">
              Save up to 10%
            </div>
            <p className="text-sf-gray">
              Identify unused licenses, optimize sandbox usage, and reduce overhead costs
            </p>
            <div className="mt-6 p-4 bg-gradient-to-r from-sf-light to-white rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-sf-blue">15</div>
                  <div className="text-sm text-sf-gray">Unused Licenses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-sf-blue">$24k</div>
                  <div className="text-sm text-sf-gray">Annual Savings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-sf-blue">3</div>
                  <div className="text-sm text-sf-gray">Optimization Areas</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm">
            <DollarSign className="w-10 h-10 text-sf-blue" />
            <h3 className="text-xl font-semibold">Cost Analysis</h3>
            <p className="text-sf-gray">Identify savings opportunities and optimize license usage</p>
          </div>
          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm">
            <ChartBar className="w-10 h-10 text-sf-blue" />
            <h3 className="text-xl font-semibold">Smart Recommendations</h3>
            <p className="text-sf-gray">Get actionable insights to reduce costs</p>
          </div>
          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm">
            <Shield className="w-10 h-10 text-sf-blue" />
            <h3 className="text-xl font-semibold">Security & Privacy</h3>
            <p className="text-sf-gray">Enterprise-grade security with data privacy controls</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-8">
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-sf-blue hover:bg-sf-hover text-lg px-8 py-6 rounded-full transition-all transform hover:scale-105"
          >
            Connect to Salesforce
          </Button>
        </div>
      </div>
    </div>
  );
};
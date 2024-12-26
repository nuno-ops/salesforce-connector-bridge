import { Button } from "@/components/ui/button";
import { ChartBar, DollarSign, Rocket } from "lucide-react";

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

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm">
            <DollarSign className="w-10 h-10 text-sf-blue" />
            <h3 className="text-xl font-semibold">Cost Analysis</h3>
            <p className="text-sf-gray">Identify savings opportunities and optimize license usage</p>
          </div>
          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm">
            <ChartBar className="w-10 h-10 text-sf-blue" />
            <h3 className="text-xl font-semibold">Usage Insights</h3>
            <p className="text-sf-gray">Track user activity and resource utilization</p>
          </div>
          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm">
            <Rocket className="w-10 h-10 text-sf-blue" />
            <h3 className="text-xl font-semibold">Smart Recommendations</h3>
            <p className="text-sf-gray">Get actionable insights to reduce costs</p>
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
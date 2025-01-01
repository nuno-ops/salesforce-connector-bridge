import { Button } from "@/components/ui/button";
import { ChartBar, DollarSign, Shield, Database, Lightbulb, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const featuresRef = useRef(null);
  const isInView = useInView(featuresRef, { once: true });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sf-light to-white p-4">
      <div className="max-w-4xl mx-auto text-center space-y-12 animate-fadeIn">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-sf-blue to-purple-600 bg-clip-text text-transparent">
            Unlock Salesforce Savings—Cut Costs and Optimize Efficiency Instantly!
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
                <div className="flex flex-col items-center gap-2">
                  <Database className="w-6 h-6 text-sf-blue animate-bounce" />
                  <div className="text-2xl font-bold text-sf-blue">15</div>
                  <div className="text-sm text-sf-gray">Unused Licenses</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <DollarSign className="w-6 h-6 text-sf-blue animate-bounce" />
                  <div className="text-2xl font-bold text-sf-blue">$24k</div>
                  <div className="text-sm text-sf-gray">Annual Savings</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <ChartBar className="w-6 h-6 text-sf-blue animate-bounce" />
                  <div className="text-2xl font-bold text-sf-blue">3</div>
                  <div className="text-sm text-sf-gray">Optimization Areas</div>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-sf-blue hover:bg-sf-hover text-lg px-8 py-6 rounded-full transition-all transform hover:scale-105"
              >
                Start Saving Now
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Grid */}
        <div 
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8"
          style={{
            transform: isInView ? "none" : "translateY(20px)",
            opacity: isInView ? 1 : 0,
            transition: "all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) 0.5s"
          }}
        >
          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-gradient-to-br from-white to-sf-light hover:shadow-lg transition-all duration-300">
            <DollarSign className="w-12 h-12 text-sf-blue animate-pulse" />
            <h3 className="text-xl font-semibold">Save Money</h3>
            <p className="text-sf-gray">Identify savings opportunities and optimize license usage</p>
          </div>
          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-gradient-to-br from-white to-sf-light hover:shadow-lg transition-all duration-300">
            <Lightbulb className="w-12 h-12 text-sf-blue animate-pulse" />
            <h3 className="text-xl font-semibold">Get Smart Tips</h3>
            <p className="text-sf-gray">Get actionable insights to reduce costs</p>
          </div>
          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-gradient-to-br from-white to-sf-light hover:shadow-lg transition-all duration-300">
            <Lock className="w-12 h-12 text-sf-blue animate-pulse" />
            <h3 className="text-xl font-semibold">Stay Secure</h3>
            <p className="text-sf-gray">Enterprise-grade security with data privacy controls</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t pt-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-sf-blue" />
              <span className="text-sf-gray font-medium">Trusted by Salesforce Users</span>
            </div>
            <div className="flex gap-4 text-sm text-sf-gray">
              <a href="/privacy" className="hover:text-sf-blue">Privacy Policy</a>
              <span>•</span>
              <a href="/terms" className="hover:text-sf-blue">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
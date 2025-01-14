import { Button } from "@/components/ui/button";
import { ChartBar, DollarSign, Shield, Database, Lightbulb, Lock, Mail } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1F2C] p-4">
      <div className="max-w-4xl mx-auto text-center space-y-16 animate-fadeIn">
        {/* Hero Section */}
        <div className="space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-white">Unlock </span>
            <span className="text-sf-blue">Salesforce </span>
            <span className="text-white">Savings</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Discover insights, reduce waste, and maximize your Salesforce investment with our powerful optimization dashboard.
          </p>
        </div>

        {/* Savings Preview */}
        <Card className="p-10 bg-[#221F26] shadow-2xl rounded-2xl border-0">
          <div className="space-y-8">
            <p className="text-3xl font-semibold text-white">
              Potential Cost Savings
            </p>
            <div className="text-5xl font-bold text-sf-blue mb-8">
              Save up to 10%
            </div>
            <p className="text-xl text-gray-200">
              Identify unused licenses, optimize sandbox usage, and reduce overhead costs
            </p>
            <div className="grid grid-cols-3 gap-8 text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Database className="w-12 h-12 text-sf-blue" />
                <div className="text-3xl font-bold text-sf-blue">15</div>
                <div className="text-base text-gray-200">Unused Licenses</div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <DollarSign className="w-12 h-12 text-sf-blue" />
                <div className="text-3xl font-bold text-sf-blue">$24k</div>
                <div className="text-base text-gray-200">Annual Savings</div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <ChartBar className="w-12 h-12 text-sf-blue" />
                <div className="text-3xl font-bold text-sf-blue">3</div>
                <div className="text-base text-gray-200">Optimization Areas</div>
              </div>
            </div>
            <Button
              onClick={onGetStarted}
              size="lg"
              className="w-full md:w-auto px-12 py-7 text-xl bg-gradient-to-r from-sf-blue to-purple-600 hover:from-sf-hover hover:to-purple-700 text-white rounded-full transition-all transform hover:scale-105 font-semibold"
            >
              Start Saving Now
            </Button>
          </div>
        </Card>

        {/* Features Grid */}
        <div 
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12"
          style={{
            transform: isInView ? "none" : "translateY(20px)",
            opacity: isInView ? 1 : 0,
            transition: "all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) 0.5s"
          }}
        >
          <Card className="p-10 bg-[#221F26] shadow-2xl rounded-2xl border-0">
            <div className="flex flex-col items-center space-y-4">
              <DollarSign className="w-14 h-14 text-sf-blue" />
              <h3 className="text-2xl font-semibold text-white">Save Money</h3>
              <p className="text-lg text-gray-200 text-center">Identify savings opportunities and optimize license usage</p>
            </div>
          </Card>
          
          <Card className="p-10 bg-[#221F26] shadow-2xl rounded-2xl border-0">
            <div className="flex flex-col items-center space-y-4">
              <Lightbulb className="w-14 h-14 text-sf-blue" />
              <h3 className="text-2xl font-semibold text-white">Get Smart Tips</h3>
              <p className="text-lg text-gray-200 text-center">Get actionable insights to reduce costs</p>
            </div>
          </Card>
          
          <Card className="p-10 bg-[#221F26] shadow-2xl rounded-2xl border-0">
            <div className="flex flex-col items-center space-y-4">
              <Lock className="w-14 h-14 text-sf-blue" />
              <h3 className="text-2xl font-semibold text-white">Stay Secure</h3>
              <p className="text-lg text-gray-200 text-center">Enterprise-grade security with data privacy controls</p>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-gray-800 pt-10">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-sf-blue" />
              <span className="text-gray-200 text-lg font-medium">Trusted by Salesforce Users</span>
            </div>
            <div className="flex gap-6 text-base text-gray-300">
              <a href="/privacy" className="hover:text-sf-blue transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="/terms" className="hover:text-sf-blue transition-colors">Terms of Service</a>
              <span>•</span>
              <a 
                href="mailto:support@salesforcesaver.com" 
                className="hover:text-sf-blue transition-colors flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Contact Support
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
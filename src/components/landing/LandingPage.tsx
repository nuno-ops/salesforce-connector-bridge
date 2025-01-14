import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartBarIcon, DollarSignIcon, ShieldCheckIcon, RocketIcon, GithubIcon, LinkedinIcon } from "lucide-react";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const [email, setEmail] = useState("");
  const featuresRef = useRef(null);
  const isInView = useInView(featuresRef, { once: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onGetStarted();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative px-4 pt-20 md:pt-32 pb-16 mx-auto max-w-7xl">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10 opacity-20" />
        
        <div className="relative space-y-8 text-center max-w-4xl mx-auto animate-fadeIn">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text">
            Unlock Your Salesforce
            <span className="text-sf-blue"> Cost Savings</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Analyze your Salesforce instance and contracts to optimize licenses, 
            reduce storage costs, and maximize your ROI.
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <Input
              type="email"
              placeholder="Enter your work email"
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-sf-blue to-purple-600 hover:from-sf-hover hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
            >
              Calculate Your Savings
            </Button>
          </form>
        </div>
      </div>

      {/* Features Section */}
      <div 
        ref={featuresRef}
        className="relative px-4 py-24 bg-black/40"
        style={{
          transform: isInView ? "none" : "translateY(20px)",
          opacity: isInView ? 1 : 0,
          transition: "all 0.9s cubic-bezier(0.17, 0.55, 0.55, 1) 0.5s"
        }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 rounded-full bg-sf-blue/10">
                <DollarSignIcon className="w-8 h-8 text-sf-blue" />
              </div>
              <h3 className="text-xl font-semibold">Cost Optimization</h3>
              <p className="text-gray-400 text-center">
                Identify savings opportunities and optimize license usage
              </p>
            </div>
          </div>
          
          <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 rounded-full bg-sf-blue/10">
                <ChartBarIcon className="w-8 h-8 text-sf-blue" />
              </div>
              <h3 className="text-xl font-semibold">Smart Analytics</h3>
              <p className="text-gray-400 text-center">
                Get actionable insights backed by data analysis
              </p>
            </div>
          </div>
          
          <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 rounded-full bg-sf-blue/10">
                <ShieldCheckIcon className="w-8 h-8 text-sf-blue" />
              </div>
              <h3 className="text-xl font-semibold">Enterprise Security</h3>
              <p className="text-gray-400 text-center">
                Bank-grade security with advanced data protection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative px-4 py-12 bg-black/60">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <RocketIcon className="w-6 h-6 text-sf-blue" />
              <span className="text-lg font-medium">SalesforceSaver.com</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="mailto:support@salesforcesaver.com" className="hover:text-white transition-colors">
                Contact Support
              </a>
            </div>
            
            <div className="flex gap-4">
              <a href="https://github.com" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <GithubIcon className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <LinkedinIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
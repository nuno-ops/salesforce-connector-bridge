import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Lock } from "lucide-react";
import { useSavingsCalculations } from "../cost-savings/SavingsCalculator";
import { useOrganizationData } from "../cost-savings/hooks/useOrganizationData";
import { LoadingSpinner } from "../ui/loading-spinner";

interface SavingsPreviewProps {
  userLicenses: any[];
  packageLicenses: any[];
  sandboxes: any[];
  onViewReport: () => void;
}

export const SavingsPreview = ({
  userLicenses,
  packageLicenses,
  sandboxes,
  onViewReport
}: SavingsPreviewProps) => {
  const {
    licensePrice,
    users,
    oauthTokens,
    isLoading: isOrgDataLoading
  } = useOrganizationData();

  const { totalSavings } = useSavingsCalculations({
    users,
    oauthTokens,
    licensePrice,
    sandboxes,
    storageUsage: 0,
    userLicenses
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <div className="relative px-4 pt-16 md:pt-24 pb-12 mx-auto max-w-4xl">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10 opacity-20" />
        
        <div className="relative space-y-6 text-center max-w-3xl mx-auto animate-fadeIn">
          <DollarSign className="h-12 w-12 mx-auto text-sf-blue" />
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
            Potential Annual Savings Identified
          </h2>
          <div className="text-4xl md:text-6xl font-bold min-h-[3rem] flex items-center justify-center">
            {isOrgDataLoading ? (
              <LoadingSpinner className="w-10 h-10" />
            ) : (
              <span className="text-sf-blue">${totalSavings.toLocaleString()}</span>
            )}
          </div>
          <p className="text-base md:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
            We've analyzed your Salesforce organization and identified significant cost-saving opportunities
          </p>
          <Button 
            onClick={onViewReport}
            size="lg"
            className="h-12 px-6 text-base font-medium bg-gradient-to-r from-sf-blue to-purple-600 hover:from-sf-hover hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
          >
            View Detailed Report
          </Button>
        </div>
      </div>
      
      <div className="relative px-4 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-2 rounded-full bg-sf-blue/10">
                <Lock className="w-6 h-6 text-sf-blue" />
              </div>
              <h3 className="text-lg font-semibold text-white">License Optimization</h3>
              <p className="text-sm text-gray-200 text-center">
                Identify unused and underutilized licenses
              </p>
            </div>
          </div>
          
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-2 rounded-full bg-sf-blue/10">
                <Lock className="w-6 h-6 text-sf-blue" />
              </div>
              <h3 className="text-lg font-semibold text-white">Package Analysis</h3>
              <p className="text-sm text-gray-200 text-center">
                Review and optimize package licenses
              </p>
            </div>
          </div>
          
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-2 rounded-full bg-sf-blue/10">
                <Lock className="w-6 h-6 text-sf-blue" />
              </div>
              <h3 className="text-lg font-semibold text-white">Infrastructure Review</h3>
              <p className="text-sm text-gray-200 text-center">
                Optimize sandbox and storage usage
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-300 pb-8">
        Questions about our plans? <a href="mailto:support@salesforcesaver.com" className="text-sf-blue hover:underline">Contact our support team</a>
      </div>
    </div>
  );
};
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
    <div className="space-y-8">
      <Card className="p-8 bg-[#0A0A0B] text-white border border-white/10 backdrop-blur-sm">
        <div className="space-y-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10 opacity-20" />
          <DollarSign className="h-16 w-16 mx-auto text-sf-blue" />
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Potential Annual Savings Identified
          </h2>
          <div className="text-5xl md:text-7xl font-bold min-h-[3.5rem] flex items-center justify-center">
            {isOrgDataLoading ? (
              <LoadingSpinner className="w-12 h-12" />
            ) : (
              `$${totalSavings.toLocaleString()}`
            )}
          </div>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            We've analyzed your Salesforce organization and identified significant cost-saving opportunities
          </p>
          <Button 
            onClick={onViewReport}
            size="lg"
            className="h-14 px-8 text-lg font-medium bg-gradient-to-r from-sf-blue to-purple-600 hover:from-sf-hover hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
          >
            View Detailed Report
          </Button>
        </div>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 rounded-full bg-sf-blue/10">
              <Lock className="w-8 h-8 text-sf-blue" />
            </div>
            <h3 className="text-xl font-semibold text-white">License Optimization</h3>
            <p className="text-gray-200 text-center">
              Identify unused and underutilized licenses
            </p>
          </div>
        </Card>
        
        <Card className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 rounded-full bg-sf-blue/10">
              <Lock className="w-8 h-8 text-sf-blue" />
            </div>
            <h3 className="text-xl font-semibold text-white">Package Analysis</h3>
            <p className="text-gray-200 text-center">
              Review and optimize package licenses
            </p>
          </div>
        </Card>
        
        <Card className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 rounded-full bg-sf-blue/10">
              <Lock className="w-8 h-8 text-sf-blue" />
            </div>
            <h3 className="text-xl font-semibold text-white">Infrastructure Review</h3>
            <p className="text-gray-200 text-center">
              Optimize sandbox and storage usage
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
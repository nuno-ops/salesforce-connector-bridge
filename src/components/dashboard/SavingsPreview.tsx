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
      <Card className="p-8 bg-gradient-to-r from-sf-blue to-sf-hover text-white">
        <div className="space-y-6 text-center">
          <DollarSign className="h-16 w-16 mx-auto" />
          <h2 className="text-3xl font-bold">
            Potential Annual Savings Identified
          </h2>
          <div className="text-5xl font-bold min-h-[3.5rem] flex items-center justify-center">
            {isOrgDataLoading ? (
              <LoadingSpinner className="w-12 h-12" />
            ) : (
              `$${totalSavings.toLocaleString()}`
            )}
          </div>
          <p className="text-lg opacity-90">
            We've analyzed your Salesforce organization and identified significant cost-saving opportunities
          </p>
          <Button 
            onClick={onViewReport}
            size="lg"
            variant="secondary"
            className="w-full md:w-auto bg-white text-sf-blue hover:bg-gray-100"
          >
            View Detailed Report
          </Button>
        </div>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border-2">
          <Lock className="h-5 w-5 text-sf-blue mb-4" />
          <h3 className="font-semibold text-lg mb-2">License Optimization</h3>
          <p className="text-sm text-gray-600">Identify unused and underutilized licenses</p>
        </Card>
        
        <Card className="p-6 border-2">
          <Lock className="h-5 w-5 text-sf-blue mb-4" />
          <h3 className="font-semibold text-lg mb-2">Package Analysis</h3>
          <p className="text-sm text-gray-600">Review and optimize package licenses</p>
        </Card>
        
        <Card className="p-6 border-2">
          <Lock className="h-5 w-5 text-sf-blue mb-4" />
          <h3 className="font-semibold text-lg mb-2">Infrastructure Review</h3>
          <p className="text-sm text-gray-600">Optimize sandbox and storage usage</p>
        </Card>
      </div>
    </div>
  );
};
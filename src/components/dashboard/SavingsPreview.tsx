import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Lock } from "lucide-react";
import { useSavingsCalculations } from "../cost-savings/SavingsCalculator";

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
  const { totalSavings } = useSavingsCalculations({
    users: [],
    oauthTokens: [],
    licensePrice: 100,
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
          <p className="text-5xl font-bold">
            ${totalSavings.toLocaleString()}
          </p>
          <p className="text-lg opacity-90">
            We've analyzed your Salesforce organization and identified significant cost-saving opportunities
          </p>
          <Button 
            onClick={onViewReport}
            size="lg"
            variant="secondary"
            className="w-full md:w-auto"
          >
            View Detailed Report
          </Button>
        </div>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <Lock className="h-5 w-5 text-sf-blue mb-2" />
          <h3 className="font-semibold">License Optimization</h3>
          <p className="text-sm text-gray-600">Identify unused and underutilized licenses</p>
        </Card>
        
        <Card className="p-6">
          <Lock className="h-5 w-5 text-sf-blue mb-2" />
          <h3 className="font-semibold">Package Analysis</h3>
          <p className="text-sm text-gray-600">Review and optimize package licenses</p>
        </Card>
        
        <Card className="p-6">
          <Lock className="h-5 w-5 text-sf-blue mb-2" />
          <h3 className="font-semibold">Infrastructure Review</h3>
          <p className="text-sm text-gray-600">Optimize sandbox and storage usage</p>
        </Card>
      </div>
    </div>
  );
};
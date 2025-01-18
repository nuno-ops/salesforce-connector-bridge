import { useOrganizationData } from "./hooks/useOrganizationData";
import { useSavingsCalculations } from "./SavingsCalculator";
import { SavingsSummaryCard } from "./SavingsSummaryCard";
import { LicenseCostInput } from "./LicenseCostInput";
import { RecommendationsSection } from "./RecommendationsSection";
import { ConsultationButton } from "../consultation/ConsultationButton";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface OptimizationDashboardProps {
  userLicenses: Array<{
    name: string;
    total: number;
    used: number;
  }>;
  packageLicenses: Array<{
    name: string;
    total: number;
    used: number;
    status: string;
  }>;
  sandboxes: any[];
  storageUsage: number;
  onDisconnect?: () => void;
}

export const OptimizationDashboard = ({
  userLicenses,
  packageLicenses,
  sandboxes,
  storageUsage,
  onDisconnect
}: OptimizationDashboardProps) => {
  const {
    licensePrice,
    setLicensePrice,
    users,
    oauthTokens
  } = useOrganizationData();

  const { totalSavings, savingsBreakdown } = useSavingsCalculations({
    users,
    oauthTokens,
    licensePrice,
    sandboxes,
    storageUsage,
    userLicenses
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="space-x-4">
          <ConsultationButton variant="outline" />
          {onDisconnect && (
            <Button variant="outline" onClick={onDisconnect}>
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <LicenseCostInput 
          licensePrice={licensePrice}
          onPriceChange={setLicensePrice}
        />

        <SavingsSummaryCard 
          totalSavings={totalSavings}
          breakdownItems={savingsBreakdown}
        />

        <RecommendationsSection items={savingsBreakdown} />
      </div>
    </div>
  );
};
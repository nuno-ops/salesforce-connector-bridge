
import { useOrganizationData } from "./hooks/useOrganizationData";
import { useSavingsCalculations } from "./SavingsCalculator";
import { SavingsSummaryCard } from "./SavingsSummaryCard";
import { LicenseCostInput } from "./LicenseCostInput";
import { RecommendationsSection } from "./RecommendationsSection";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useEffect } from "react";

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
  onSavingsCalculated?: (savings: { totalSavings: number; savingsBreakdown: any[] }) => void;
}

export const OptimizationDashboard = ({
  userLicenses,
  packageLicenses,
  sandboxes,
  storageUsage,
  onDisconnect,
  onSavingsCalculated
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

  // Notify parent components when savings are calculated
  useEffect(() => {
    if (onSavingsCalculated) {
      onSavingsCalculated({ totalSavings, savingsBreakdown });
    }
  }, [totalSavings, savingsBreakdown, onSavingsCalculated]);

  return (
    <div>
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

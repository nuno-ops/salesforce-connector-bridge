import { useOrganizationData } from "./hooks/useOrganizationData";
import { useSavingsCalculations } from "./SavingsCalculator";
import { SavingsSummaryCard } from "./SavingsSummaryCard";
import { LicenseCostInput } from "./LicenseCostInput";
import { RecommendationsSection } from "./RecommendationsSection";

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
}

export const OptimizationDashboard = ({
  userLicenses,
  packageLicenses,
  sandboxes,
  storageUsage
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
    storageUsage
  });

  return (
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
  );
};
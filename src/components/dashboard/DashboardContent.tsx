import { useSavingsCalculations } from "@/components/cost-savings/SavingsCalculator";
import { useOrganizationData } from "@/components/cost-savings/hooks/useOrganizationData";
import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { OrgHealth } from "@/components/OrgHealth";
import { DashboardHeader } from "./DashboardHeader";
import { useExportReport } from "./useExportReport";
import { ToolAnalysis } from "../tools/ToolAnalysis";
import { ReportAccessTimer } from "./ReportAccessTimer";
import { useEffect } from "react";

interface DashboardContentProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users?: any[];
  oauthTokens?: any[];
}

export const DashboardContent = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits,
  users = [],
  oauthTokens = []
}: DashboardContentProps) => {
  const { licensePrice } = useOrganizationData();
  const { isExporting, handleExport } = useExportReport();
  
  const { 
    totalSavings,
    savingsBreakdown,
    inactiveUsers,
    integrationUsers,
    platformUsers
  } = useSavingsCalculations({
    users,
    oauthTokens,
    licensePrice,
    sandboxes,
    storageUsage: limits?.StorageUsed || 0,
    userLicenses
  });

  // Expand cost savings section by default
  useEffect(() => {
    const event = new CustomEvent('expandSection', {
      detail: { sectionId: 'cost-savings' }
    });
    window.dispatchEvent(event);
  }, []);

  return (
    <div className="space-y-8">
      <DashboardHeader 
        isExporting={isExporting}
        onExport={handleExportReport}
      />
      
      <ReportAccessTimer />
      
      <div id="cost-savings">
        <OptimizationDashboard
          userLicenses={userLicenses}
          packageLicenses={packageLicenses}
          sandboxes={sandboxes}
          storageUsage={limits?.StorageUsed || 0}
        />
      </div>
      
      <div id="tool-analysis">
        <ToolAnalysis oauthTokens={oauthTokens} />
      </div>
      
      <div id="cost-savings-report">
        <CostSavingsReport
          userLicenses={userLicenses}
          packageLicenses={packageLicenses}
          permissionSetLicenses={permissionSetLicenses}
          sandboxes={sandboxes}
          apiUsage={limits?.DailyApiRequests?.Max || 0}
          storageUsage={limits?.StorageUsed || 0}
          contracts={[]}
          invoices={[]}
        />
      </div>

      <div id="org-health">
        <OrgHealth />
      </div>
    </div>
  );
};
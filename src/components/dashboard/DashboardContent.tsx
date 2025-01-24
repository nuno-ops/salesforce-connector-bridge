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

  const handleExportReport = () => {
    handleExport({
      userLicenses,
      packageLicenses,
      permissionSetLicenses,
      sandboxes,
      limits,
      users,
      oauthTokens,
      inactiveUsers,
      integrationUsers,
      platformUsers,
      savingsBreakdown,
      licensePrice
    });
  };

  return (
    <div className="min-h-screen bg-[#F1F0FB] pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardHeader 
          isExporting={isExporting}
          onExport={handleExportReport}
        />
        
        <ReportAccessTimer />
        
        <div className="space-y-8 mt-8">
          {/* Cost Savings Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div id="cost-savings">
              <OptimizationDashboard
                userLicenses={userLicenses}
                packageLicenses={packageLicenses}
                sandboxes={sandboxes}
                storageUsage={limits?.StorageUsed || 0}
              />
            </div>
          </section>

          {/* Tool Analysis Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div id="tool-analysis">
              <ToolAnalysis oauthTokens={oauthTokens} />
            </div>
          </section>

          {/* Cost Savings Report Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
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
          </section>

          {/* Users Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div id="users">
              <SalesforceUsers />
            </div>
          </section>

          {/* Org Health Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div id="org-health">
              <OrgHealth />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
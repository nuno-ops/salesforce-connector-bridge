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
import { TrendingUp, Users, Activity, BarChart3 } from "lucide-react";

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
          {/* Cost Savings Section - Primary Focus */}
          <section className="bg-gradient-to-r from-sf-blue/5 to-sf-hover/5 rounded-lg shadow-lg border border-sf-blue/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-sf-blue/10">
                <TrendingUp className="h-6 w-6 text-sf-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-sf-blue">Cost Optimization</h2>
                <p className="text-sf-gray">Analyze and optimize your Salesforce costs</p>
              </div>
            </div>
            <div id="cost-savings">
              <OptimizationDashboard
                userLicenses={userLicenses}
                packageLicenses={packageLicenses}
                sandboxes={sandboxes}
                storageUsage={limits?.StorageUsed || 0}
              />
            </div>
          </section>

          {/* Tool Analysis Section - Secondary */}
          <section className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-gray-100">
                <BarChart3 className="h-5 w-5 text-sf-gray" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Tool Analysis</h3>
                <p className="text-sf-gray">Review connected tools and integrations</p>
              </div>
            </div>
            <div id="tool-analysis">
              <ToolAnalysis oauthTokens={oauthTokens} />
            </div>
          </section>

          {/* Cost Savings Report Section */}
          <section className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-gray-100">
                <Activity className="h-5 w-5 text-sf-gray" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Detailed Analysis</h3>
                <p className="text-sf-gray">Comprehensive cost savings report</p>
              </div>
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
          </section>

          {/* Users Section */}
          <section className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-gray-100">
                <Users className="h-5 w-5 text-sf-gray" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
                <p className="text-sf-gray">Review and manage Salesforce users</p>
              </div>
            </div>
            <div id="users">
              <SalesforceUsers />
            </div>
          </section>

          {/* Org Health Section */}
          <section className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-full bg-gray-100">
                <Activity className="h-5 w-5 text-sf-gray" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Organization Health</h3>
                <p className="text-sf-gray">Monitor your Salesforce organization's health</p>
              </div>
            </div>
            <div id="org-health">
              <OrgHealth />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
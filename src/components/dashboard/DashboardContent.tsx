import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateReportCSV, downloadCSV } from "@/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { useSavingsCalculations } from "@/components/cost-savings/SavingsCalculator";
import { useOrganizationData } from "@/components/cost-savings/hooks/useOrganizationData";
import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { OrgHealth } from "@/components/OrgHealth";

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
  const { toast } = useToast();
  const { licensePrice } = useOrganizationData();
  const [isExporting, setIsExporting] = useState(false);
  
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

  console.log('DashboardContent - Savings data:', {
    totalSavings,
    savingsBreakdown,
    inactiveUsersCount: inactiveUsers?.length,
    integrationUsersCount: integrationUsers?.length,
    licensePrice
  });

  const handleExportReport = async () => {
    try {
      setIsExporting(true);

      // Extract savings from savingsBreakdown
      const inactiveUserSavings = savingsBreakdown.find(s => s.title === "Inactive User Licenses")?.amount || 0;
      const integrationUserSavings = savingsBreakdown.find(s => s.title === "Integration User Optimization")?.amount || 0;
      const platformLicenseSavings = savingsBreakdown.find(s => s.title === "Platform License Optimization")?.amount || 0;
      const sandboxSavings = savingsBreakdown.find(s => s.title === "Sandbox Optimization")?.amount || 0;
      const storageSavings = savingsBreakdown.find(s => s.title === "Storage Optimization")?.amount || 0;

      console.log('Export Report - Extracted savings:', {
        inactiveUserSavings,
        integrationUserSavings,
        platformLicenseSavings,
        sandboxSavings,
        storageSavings
      });

      const csvContent = await generateReportCSV({
        userLicenses,
        packageLicenses,
        permissionSetLicenses,
        sandboxes,
        limits,
        users,
        oauthTokens,
        storageUsage: limits?.StorageUsed || 0,
        inactiveUserSavings,
        integrationUserSavings,
        platformLicenseSavings,
        sandboxSavings,
        storageSavings,
        inactiveUserCount: inactiveUsers?.length || 0,
        integrationUserCount: integrationUsers?.length || 0,
        platformLicenseCount: platformUsers?.length || 0,
        licensePrice
      });
      
      downloadCSV(csvContent, 'salesforce-optimization-report.csv');
      
      toast({
        title: "Success",
        description: "Report downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate the report. Please try again."
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Organization Health Dashboard</h1>
        <Button
          onClick={handleExportReport}
          variant="outline"
          className="flex items-center gap-2"
          disabled={isExporting || !users.length}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? "Generating Report..." : "Export Report"}
        </Button>
      </div>
      
      <OptimizationDashboard
        userLicenses={userLicenses}
        packageLicenses={packageLicenses}
        sandboxes={sandboxes}
        storageUsage={limits?.StorageUsed || 0}
      />
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
      <SalesforceUsers />
      <OrgHealth />
    </div>
  );
};
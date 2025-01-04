import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { OrgHealth } from "@/components/OrgHealth";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DashboardContentProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  onExportReport: () => void;
}

export const DashboardContent = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits,
  onExportReport
}: DashboardContentProps) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Organization Health Dashboard</h1>
        <Button
          onClick={onExportReport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Report
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
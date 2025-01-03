import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { OrgHealth } from "@/components/OrgHealth";
import { DownloadPdfButton } from "../pdf/DownloadPdfButton";

interface DashboardContentProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
}

export const DashboardContent = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits
}: DashboardContentProps) => {
  return (
    <div className="space-y-8">
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
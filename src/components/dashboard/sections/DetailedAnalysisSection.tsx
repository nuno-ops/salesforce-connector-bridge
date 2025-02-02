import { CostSavingsReport } from "@/components/CostSavingsReport";
import { Activity } from "lucide-react";

interface DetailedAnalysisSectionProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
}

export const DetailedAnalysisSection = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits
}: DetailedAnalysisSectionProps) => {
  return (
    <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-full bg-gray-100">
          <Activity className="h-5 w-5 text-sf-text-secondary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-sf-text-primary">Detailed Analysis</h3>
          <p className="text-sf-text-secondary">Comprehensive cost savings report</p>
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
  );
};
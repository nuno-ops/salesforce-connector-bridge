import { LicensesSection } from './org-health/LicensesSection';
import { LimitsSection } from './org-health/LimitsSection';
import { MetricsSection } from './org-health/MetricsSection';
import { SandboxList } from './org-health/SandboxList';
import { QuotePdfDownloader } from './salesforce/QuotePdfDownloader';
import { useOrgHealthData } from './org-health/useOrgHealthData';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export const OrgHealth = () => {
  const {
    limits,
    sandboxes,
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    metrics,
    isLoading,
    error
  } = useOrgHealthData();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Test Quote PDF Download */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Quote PDF Download (Test)</h2>
        <QuotePdfDownloader quoteId="0xfed000001fVNRAA2" />
      </div>

      <LicensesSection 
        userLicenses={userLicenses || []}
        packageLicenses={packageLicenses || []}
        permissionSetLicenses={permissionSetLicenses || []}
      />
      <LimitsSection limits={limits!} />
      <MetricsSection metrics={metrics} />
      <SandboxList sandboxes={sandboxes || []} />
    </div>
  );
};
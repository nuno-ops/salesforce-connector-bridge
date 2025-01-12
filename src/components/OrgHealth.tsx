import { LicensesSection } from './org-health/LicensesSection';
import { LimitsSection } from './org-health/LimitsSection';
import { MetricsSection } from './org-health/MetricsSection';
import { SandboxList } from './org-health/SandboxList';
import { useOrgHealthData } from './org-health/useOrgHealthData';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

export const OrgHealth = () => {
  const [searchParams] = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
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

  console.log('OrgHealth component data:', {
    hasLimits: !!limits,
    limitsData: limits,
    hasSandboxes: Array.isArray(sandboxes),
    sandboxCount: sandboxes?.length,
    hasMetrics: !!metrics,
    licenseData: {
      userLicenses: userLicenses?.length,
      packageLicenses: packageLicenses?.length,
      permissionSetLicenses: permissionSetLicenses?.length,
    }
  });

  useEffect(() => {
    setIsExpanded(searchParams.get('expanded') === 'true');
  }, [searchParams]);

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
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <LicensesSection 
        userLicenses={userLicenses || []}
        packageLicenses={packageLicenses || []}
        permissionSetLicenses={permissionSetLicenses || []}
        defaultExpanded={isExpanded}
      />
      <LimitsSection limits={limits} defaultExpanded={isExpanded} />
      <MetricsSection metrics={metrics} defaultExpanded={isExpanded} />
      <SandboxList sandboxes={sandboxes} defaultExpanded={isExpanded} />
    </div>
  );
};
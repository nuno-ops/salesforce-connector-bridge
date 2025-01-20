import { LicensesSection } from './org-health/LicensesSection';
import { LimitsSection } from './org-health/LimitsSection';
import { MetricsSection } from './org-health/MetricsSection';
import { SandboxList } from './org-health/SandboxList';
import { useOrgHealthData } from './org-health/useOrgHealthData';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export const OrgHealth = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
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
    // Get the hash without the '#' symbol
    const hash = location.hash.slice(1);
    if (hash) {
      setExpandedSection(hash);
    }
  }, [location.hash]);

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
      <div id="licenses">
        <LicensesSection 
          userLicenses={userLicenses || []}
          packageLicenses={packageLicenses || []}
          permissionSetLicenses={permissionSetLicenses || []}
          defaultExpanded={expandedSection === 'licenses'}
        />
      </div>
      
      <div id="organization-limits">
        <LimitsSection 
          limits={limits} 
          defaultExpanded={expandedSection === 'organization-limits'} 
        />
      </div>
      
      <div id="operational-metrics">
        <MetricsSection 
          metrics={metrics} 
          defaultExpanded={expandedSection === 'operational-metrics'} 
        />
      </div>
      
      <div id="active-sandboxes">
        <SandboxList 
          sandboxes={sandboxes} 
          defaultExpanded={expandedSection === 'active-sandboxes'} 
        />
      </div>
    </div>
  );
};
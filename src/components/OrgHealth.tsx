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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
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

  console.log('OrgHealth render - Current hash:', location.hash);
  console.log('OrgHealth render - Expanded sections:', Array.from(expandedSections));

  useEffect(() => {
    // Get the hash without the '#' symbol
    const hash = location.hash.slice(1);
    console.log('Hash changed effect - New hash:', hash);
    
    if (hash) {
      console.log('Expanding section:', hash);
      setExpandedSections(prev => {
        const newSet = new Set(prev);
        newSet.add(hash);
        return newSet;
      });
    }
  }, [location.hash]);

  const isExpanded = (sectionId: string) => {
    const expanded = expandedSections.has(sectionId);
    console.log(`Checking if section ${sectionId} is expanded:`, expanded);
    return expanded;
  };

  const handleSectionToggle = (sectionId: string, isOpen: boolean) => {
    console.log(`Toggle section ${sectionId} to ${isOpen}`);
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(sectionId);
      } else {
        newSet.delete(sectionId);
      }
      return newSet;
    });
  };

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
          isOpen={isExpanded('licenses')}
          onOpenChange={(isOpen) => handleSectionToggle('licenses', isOpen)}
        />
      </div>
      
      <div id="organization-limits">
        <LimitsSection 
          limits={limits}
          isOpen={isExpanded('organization-limits')}
          onOpenChange={(isOpen) => handleSectionToggle('organization-limits', isOpen)}
        />
      </div>
      
      <div id="operational-metrics">
        <MetricsSection 
          metrics={metrics}
          isOpen={isExpanded('operational-metrics')}
          onOpenChange={(isOpen) => handleSectionToggle('operational-metrics', isOpen)}
        />
      </div>
      
      <div id="active-sandboxes">
        <SandboxList 
          sandboxes={sandboxes}
          isOpen={isExpanded('active-sandboxes')}
          onOpenChange={(isOpen) => handleSectionToggle('active-sandboxes', isOpen)}
        />
      </div>
    </div>
  );
};
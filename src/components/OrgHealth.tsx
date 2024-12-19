import { Loader2, AlertCircle } from 'lucide-react';
import { CostSavingsReport } from './CostSavingsReport';
import { SandboxList } from './org-health/SandboxList';
import { useOrgHealthData } from './org-health/useOrgHealthData';
import { useContractsData } from './org-health/useContractsData';
import { MetricsSection } from './org-health/MetricsSection';
import { LimitsSection } from './org-health/LimitsSection';
import { LicensesSection } from './org-health/LicensesSection';
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from './org-health/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const OrgHealth = () => {
  console.log('OrgHealth component rendering');
  
  const {
    limits,
    sandboxes,
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    metrics,
    isLoading: isLoadingOrgData,
    error: orgDataError
  } = useOrgHealthData();

  const {
    contracts,
    invoices,
    isLoading: isLoadingContracts,
    error: contractsError
  } = useContractsData();

  console.log('Data states:', {
    hasLimits: !!limits,
    hasSandboxes: !!sandboxes?.length,
    hasUserLicenses: !!userLicenses?.length,
    hasPackageLicenses: !!packageLicenses?.length,
    hasPermissionSetLicenses: !!permissionSetLicenses?.length,
    hasMetrics: !!metrics,
    hasContracts: !!contracts?.length,
    hasInvoices: !!invoices?.length,
    isLoadingOrgData,
    isLoadingContracts,
    orgDataError,
    contractsError
  });

  console.log('Raw data:', {
    limits,
    sandboxes,
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    metrics,
    contracts,
    invoices
  });

  const isLoading = isLoadingOrgData || isLoadingContracts;
  const error = orgDataError || contractsError;

  if (isLoading) {
    console.log('Showing loading state');
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.log('Showing error state:', error);
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!limits) {
    console.log('No limits data available');
    return (
      <Alert className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>Unable to load organization limits data.</AlertDescription>
      </Alert>
    );
  }

  console.log('Calculating usage percentages');
  const apiUsagePercentage = ((limits.DailyApiRequests.Max - limits.DailyApiRequests.Remaining) / limits.DailyApiRequests.Max) * 100;
  const storageUsagePercentage = ((limits.DataStorageMB.Max - limits.DataStorageMB.Remaining) / limits.DataStorageMB.Max) * 100;

  console.log('Preparing to render components with data:', {
    apiUsagePercentage,
    storageUsagePercentage,
    formattedUserLicenses: formatLicenseData(userLicenses),
    formattedPackageLicenses: formatPackageLicenseData(packageLicenses),
    formattedPermissionSetLicenses: formatPermissionSetLicenseData(permissionSetLicenses)
  });

  console.log('Rendering full component');
  return (
    <div className="space-y-8">
      <CostSavingsReport
        userLicenses={formatLicenseData(userLicenses)}
        packageLicenses={formatPackageLicenseData(packageLicenses)}
        permissionSetLicenses={formatPermissionSetLicenseData(permissionSetLicenses)}
        inactiveUsers={[]}
        sandboxes={sandboxes}
        apiUsage={apiUsagePercentage}
        storageUsage={storageUsagePercentage}
        contracts={contracts}
        invoices={invoices}
      />

      <MetricsSection metrics={metrics} />
      <LimitsSection limits={limits} />
      <LicensesSection 
        userLicenses={userLicenses}
        packageLicenses={packageLicenses}
        permissionSetLicenses={permissionSetLicenses}
      />

      <SandboxList sandboxes={sandboxes} />
    </div>
  );
};
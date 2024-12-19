import { Loader2 } from 'lucide-react';
import { CostSavingsReport } from './CostSavingsReport';
import { SandboxList } from './org-health/SandboxList';
import { useOrgHealthData } from './org-health/useOrgHealthData';
import { useContractsData } from './org-health/useContractsData';
import { MetricsSection } from './org-health/MetricsSection';
import { LimitsSection } from './org-health/LimitsSection';
import { LicensesSection } from './org-health/LicensesSection';
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from './org-health/utils';

export const OrgHealth = () => {
  const {
    limits,
    sandboxes,
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    metrics,
    isLoading: isLoadingOrgData
  } = useOrgHealthData();

  const {
    contracts,
    invoices,
    isLoading: isLoadingContracts
  } = useContractsData();

  const isLoading = isLoadingOrgData || isLoadingContracts;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!limits) {
    return null;
  }

  const apiUsagePercentage = ((limits.DailyApiRequests.Max - limits.DailyApiRequests.Remaining) / limits.DailyApiRequests.Max) * 100;
  const storageUsagePercentage = ((limits.DataStorageMB.Max - limits.DataStorageMB.Remaining) / limits.DataStorageMB.Max) * 100;

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
import { Loader2 } from 'lucide-react';
import { LimitCard } from './org-health/LimitCard';
import { SandboxList } from './org-health/SandboxList';
import { LicenseCard } from './org-health/LicenseCard';
import { MetricsCard } from './org-health/MetricsCard';
import { CostSavingsReport } from './CostSavingsReport';
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from './org-health/utils';
import { useOrgHealthData } from './org-health/useOrgHealthData';
import { calculateMonthlyMetrics } from './org-health/MetricsCalculator';

export const OrgHealth = () => {
  const {
    limits,
    sandboxes,
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    metrics,
    isLoading
  } = useOrgHealthData();

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

  const { leadConversion, oppWinRate } = calculateMonthlyMetrics(metrics);
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
      />

      <div className="grid gap-4 md:grid-cols-2">
        <MetricsCard 
          title="Lead Conversion Rate (Last 6 Months)" 
          data={leadConversion}
          valueLabel="Conversion Rate"
        />
        <MetricsCard 
          title="Opportunity Win Rate (Last 6 Months)" 
          data={oppWinRate}
          valueLabel="Win Rate"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LimitCard
          title="Data Storage"
          max={limits.DataStorageMB.Max}
          remaining={limits.DataStorageMB.Remaining}
          unit="MB"
        />
        <LimitCard
          title="File Storage"
          max={limits.FileStorageMB.Max}
          remaining={limits.FileStorageMB.Remaining}
          unit="MB"
        />
        <LimitCard
          title="Daily API Requests"
          max={limits.DailyApiRequests.Max}
          remaining={limits.DailyApiRequests.Remaining}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LicenseCard 
          title="User Licenses" 
          licenses={formatLicenseData(userLicenses)} 
        />
        <LicenseCard 
          title="Package Licenses" 
          licenses={formatPackageLicenseData(packageLicenses)} 
        />
        <LicenseCard 
          title="Permission Set Licenses" 
          licenses={formatPermissionSetLicenseData(permissionSetLicenses)} 
        />
      </div>

      <SandboxList sandboxes={sandboxes} />
    </div>
  );
};
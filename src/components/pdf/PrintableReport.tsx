import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { calculateMonthlyMetrics } from "../org-health/MetricsCalculator";
import { useSavingsCalculations } from "../cost-savings/SavingsCalculator";
import { useOrganizationData } from "../cost-savings/hooks/useOrganizationData";
import { ReportHeader } from "./sections/ReportHeader";
import { SavingsSummary } from "./sections/SavingsSummary";
import { LicenseOptimizationSection } from "./sections/LicenseOptimizationSection";
import { OperationalMetricsSection } from "./sections/OperationalMetricsSection";
import { filterStandardSalesforceUsers, filterInactiveUsers, maskUsername } from "../users/utils/userFilters";

interface PrintableReportProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  metrics: any;
}

export const PrintableReport = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits,
  metrics
}: PrintableReportProps) => {
  const { leadConversion, oppWinRate } = calculateMonthlyMetrics(metrics);
  
  // Get savings data
  const {
    licensePrice,
    users,
    oauthTokens
  } = useOrganizationData();

  const { totalSavings, savingsBreakdown } = useSavingsCalculations({
    users,
    oauthTokens,
    licensePrice,
    sandboxes,
    storageUsage: limits?.StorageUsed || 0,
    userLicenses
  });

  // Process users for license optimization
  const standardUsers = filterStandardSalesforceUsers(users);
  const inactiveUsers = filterInactiveUsers(standardUsers);
  const integrationUsers = standardUsers.filter(user => {
    const userOAuthApps = getUserOAuthApps(user.Id);
    return userOAuthApps.length > 0;
  });
  const platformUsers = standardUsers.filter(user => user.isPlatformEligible);

  const getUserOAuthApps = (userId: string) => {
    return oauthTokens
      .filter(token => token.UserId === userId)
      .map(token => token.AppName)
      .filter((value, index, self) => self.indexOf(value) === index);
  };

  return (
    <div className="p-8 space-y-8 bg-white min-h-screen">
      <ReportHeader />
      
      <SavingsSummary 
        totalSavings={totalSavings}
        savingsBreakdown={savingsBreakdown}
      />

      <LicenseOptimizationSection 
        inactiveUsers={inactiveUsers}
        integrationUsers={integrationUsers}
        platformUsers={platformUsers}
        getUserOAuthApps={getUserOAuthApps}
        maskUsername={maskUsername}
      />

      {/* License Usage Section */}
      <Card>
        <CardHeader>
          <CardTitle>License Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Licenses */}
          <div>
            <h3 className="font-semibold mb-4">User Licenses</h3>
            <div className="grid gap-4">
              {userLicenses.map((license, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{license.name}</span>
                    <span>{license.used} / {license.total}</span>
                  </div>
                  <Progress value={(license.used / license.total) * 100} />
                </div>
              ))}
            </div>
          </div>

          {/* Package Licenses */}
          <div>
            <h3 className="font-semibold mb-4">Package Licenses</h3>
            <div className="grid gap-4">
              {packageLicenses.map((license, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{license.name}</span>
                    <Badge variant={license.status === 'Active' ? 'default' : 'secondary'}>
                      {license.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Usage</span>
                    <span>{license.used} / {license.total}</span>
                  </div>
                  <Progress value={(license.used / license.total) * 100} />
                </div>
              ))}
            </div>
          </div>

          {/* Permission Set Licenses */}
          <div>
            <h3 className="font-semibold mb-4">Permission Set Licenses</h3>
            <div className="grid gap-4">
              {permissionSetLicenses.map((license, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{license.name}</span>
                    <span>{license.used} / {license.total}</span>
                  </div>
                  <Progress value={(license.used / license.total) * 100} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <OperationalMetricsSection 
        leadConversion={leadConversion}
        oppWinRate={oppWinRate}
      />

      {/* Active Sandboxes */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sandboxes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {sandboxes.map((sandbox) => (
              <div key={sandbox.Id} className="border p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{sandbox.SandboxName}</span>
                  <Badge>{sandbox.LicenseType}</Badge>
                </div>
                {sandbox.Description && (
                  <p className="text-sm text-muted-foreground">{sandbox.Description}</p>
                )}
              </div>
            ))}
            {sandboxes.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No active sandboxes found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
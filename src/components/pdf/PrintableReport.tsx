import { useEffect, useState } from "react";
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
import { filterStandardSalesforceUsers } from "../users/utils/userFilters";

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
  const [isDataReady, setIsDataReady] = useState(false);
  const { leadConversion, oppWinRate } = calculateMonthlyMetrics(metrics);
  
  const {
    licensePrice,
    users,
    oauthTokens
  } = useOrganizationData();

  // Initialize data only when everything is available
  useEffect(() => {
    if (users?.length > 0 && userLicenses?.length > 0 && oauthTokens) {
      setIsDataReady(true);
    }
  }, [users, userLicenses, oauthTokens]);

  // Wait for data initialization
  if (!isDataReady) {
    return (
      <div className="p-8 space-y-8 bg-white min-h-screen">
        <p>Preparing report data...</p>
      </div>
    );
  }

  // Process users after ensuring data is available
  const standardUsers = filterStandardSalesforceUsers(users);
  
  const { totalSavings, savingsBreakdown } = useSavingsCalculations({
    users: standardUsers,
    oauthTokens,
    licensePrice,
    sandboxes,
    storageUsage: limits?.StorageUsed || 0,
    userLicenses
  });

  return (
    <div id="pdf-content" className="p-8 space-y-8 bg-white min-h-screen">
      <ReportHeader />
      
      <SavingsSummary 
        totalSavings={totalSavings}
        savingsBreakdown={savingsBreakdown}
      />

      <LicenseOptimizationSection 
        inactiveUsers={[]}
        integrationUsers={[]}
        platformUsers={[]}
        getUserOAuthApps={(userId: string) => []}
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
        </CardContent>
      </Card>

      <OperationalMetricsSection 
        leadConversion={leadConversion}
        oppWinRate={oppWinRate}
      />
    </div>
  );
};
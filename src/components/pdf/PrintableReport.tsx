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
  console.log('PrintableReport rendering with data:', {
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    sandboxes,
    limits,
    metrics
  });

  // Initialize state outside of any conditions
  const [processedData, setProcessedData] = useState<any>(null);
  const { leadConversion, oppWinRate } = calculateMonthlyMetrics(metrics || {});
  const { licensePrice, users, oauthTokens } = useOrganizationData();

  useEffect(() => {
    console.log('Processing data in useEffect');
    if (users?.length > 0 && userLicenses?.length > 0) {
      console.log('Data available for processing');
      setProcessedData({
        users,
        userLicenses,
        oauthTokens
      });
    }
  }, [users, userLicenses, oauthTokens]);

  // Ensure we have all required data
  if (!processedData || !licensePrice) {
    console.log('Waiting for data initialization...');
    return (
      <div className="p-8 space-y-8 bg-white min-h-screen">
        <p>Preparing report data...</p>
      </div>
    );
  }

  console.log('Calculating savings with license price:', licensePrice);
  const { totalSavings, savingsBreakdown } = useSavingsCalculations({
    users: processedData.users,
    oauthTokens: processedData.oauthTokens,
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

      <Card>
        <CardHeader>
          <CardTitle>License Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
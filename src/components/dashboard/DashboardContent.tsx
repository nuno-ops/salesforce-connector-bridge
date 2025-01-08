import { useState } from "react";
import { OrgHealth } from "@/components/OrgHealth";
import { CostSavingsReport } from "@/components/CostSavingsReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateReportCSV, downloadCSV } from "@/utils/csvExport";
import { useOrganizationData } from "../cost-savings/hooks/useOrganizationData";
import { useSavingsCalculations } from "../cost-savings/SavingsCalculator";

interface DashboardContentProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users: any[];
  oauthTokens: any[];
}

export const DashboardContent = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits,
  users,
  oauthTokens
}: DashboardContentProps) => {
  const [activeTab, setActiveTab] = useState("health");
  const { licensePrice } = useOrganizationData();

  console.log('DashboardContent - Initial props:', {
    userLicenses: userLicenses?.length,
    packageLicenses: packageLicenses?.length,
    users: users?.length,
    oauthTokens: oauthTokens?.length,
    licensePrice
  });

  const { totalSavings, savingsBreakdown } = useSavingsCalculations({
    users,
    oauthTokens,
    licensePrice,
    sandboxes,
    storageUsage: limits?.DataStorageMB?.Used || 0,
    userLicenses
  });

  console.log('DashboardContent - Savings calculations:', {
    totalSavings,
    savingsBreakdown,
    userCount: users?.length
  });

  const handleExport = async () => {
    console.log('Export initiated with data:', {
      users: users?.length,
      licensePrice,
      savingsBreakdown
    });

    const csvContent = await generateReportCSV({
      userLicenses,
      packageLicenses,
      permissionSetLicenses,
      sandboxes,
      limits,
      users,
      oauthTokens,
      licensePrice,
      savingsBreakdown
    });

    downloadCSV(csvContent, 'salesforce-optimization-report.csv');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Tabs defaultValue="health" className="w-full" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="health">Organization Health</TabsTrigger>
            <TabsTrigger value="savings">Cost Savings</TabsTrigger>
          </TabsList>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          <TabsContent value="health" className="mt-6">
            <OrgHealth />
          </TabsContent>

          <TabsContent value="savings" className="mt-6">
            <CostSavingsReport
              userLicenses={userLicenses}
              packageLicenses={packageLicenses}
              permissionSetLicenses={permissionSetLicenses}
              sandboxes={sandboxes}
              limits={limits}
              users={users}
              oauthTokens={oauthTokens}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
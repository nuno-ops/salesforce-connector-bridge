import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardCards } from "./DashboardCards";
import { DashboardTabs } from "./DashboardTabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardContentProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users: any[];
  oauthTokens: any[];
  savingsBreakdown: any[];
  totalSavings: number;
  licensePrice: number;
}

export const DashboardContent = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits,
  users,
  oauthTokens,
  savingsBreakdown,
  totalSavings,
  licensePrice,
}: DashboardContentProps) => {
  return (
    <div className="flex">
      <DashboardSidebar
        userLicenses={userLicenses}
        packageLicenses={packageLicenses}
        permissionSetLicenses={permissionSetLicenses}
        sandboxes={sandboxes}
        limits={limits}
        users={users}
        oauthTokens={oauthTokens}
        savingsBreakdown={savingsBreakdown}
        totalSavings={totalSavings}
        licensePrice={licensePrice}
      />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DashboardHeader />
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="space-y-4">
            <DashboardCards
              userLicenses={userLicenses}
              packageLicenses={packageLicenses}
              permissionSetLicenses={permissionSetLicenses}
              sandboxes={sandboxes}
              limits={limits}
              users={users}
              oauthTokens={oauthTokens}
              savingsBreakdown={savingsBreakdown}
              totalSavings={totalSavings}
            />
            <DashboardTabs
              userLicenses={userLicenses}
              packageLicenses={packageLicenses}
              permissionSetLicenses={permissionSetLicenses}
              sandboxes={sandboxes}
              limits={limits}
              users={users}
              oauthTokens={oauthTokens}
              savingsBreakdown={savingsBreakdown}
              totalSavings={totalSavings}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardHeader } from "./sections/DashboardHeader";
import { CostOptimizationSection } from "./sections/CostOptimizationSection";
import { ToolAnalysisSection } from "./sections/ToolAnalysisSection";
import { DetailedAnalysisSection } from "./sections/DetailedAnalysisSection";
import { UserManagementSection } from "./sections/UserManagementSection";
import { OrganizationHealthSection } from "./sections/OrganizationHealthSection";
import { ReportAccessTimer } from "./ReportAccessTimer";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardContentProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users?: any[];
  oauthTokens?: any[];
  savingsBreakdown?: any[];
  totalSavings?: number;
  onDisconnect?: () => void;
}

export const DashboardContent = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits,
  users = [],
  oauthTokens = [],
  savingsBreakdown = [],
  totalSavings = 0,
  onDisconnect
}: DashboardContentProps) => {
  return (
    <div className="min-h-screen bg-sf-bg flex">
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
        onDisconnect={onDisconnect}
      />
      
      <ScrollArea className="h-screen flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardHeader onDisconnect={onDisconnect} />
          <ReportAccessTimer />
          
          <div className="space-y-8 mt-8">
            <CostOptimizationSection
              userLicenses={userLicenses}
              packageLicenses={packageLicenses}
              sandboxes={sandboxes}
              storageUsage={limits?.StorageUsed || 0}
            />

            <ToolAnalysisSection oauthTokens={oauthTokens} />

            <DetailedAnalysisSection
              userLicenses={userLicenses}
              packageLicenses={packageLicenses}
              permissionSetLicenses={permissionSetLicenses}
              sandboxes={sandboxes}
              limits={limits}
            />

            <UserManagementSection />

            <OrganizationHealthSection />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
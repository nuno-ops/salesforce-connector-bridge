import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardHeader } from "./sections/DashboardHeader";
import { CostOptimizationSection } from "./sections/CostOptimizationSection";
import { ToolAnalysisSection } from "./sections/ToolAnalysisSection";
import { DetailedAnalysisSection } from "./sections/DetailedAnalysisSection";
import { SalesforceUsers } from "@/components/SalesforceUsers";
import { OrgHealth } from "@/components/OrgHealth";
import { ReportAccessTimer } from "./ReportAccessTimer";
import { Users, Activity } from "lucide-react";

interface DashboardContentProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users?: any[];
  oauthTokens?: any[];
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
  onDisconnect
}: DashboardContentProps) => {
  return (
    <div className="min-h-screen bg-sf-bg">
      <ScrollArea className="h-screen">
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

            <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-gray-100">
                  <Users className="h-5 w-5 text-sf-text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-sf-text-primary">User Management</h3>
                  <p className="text-sf-text-secondary">Review and manage Salesforce users</p>
                </div>
              </div>
              <div id="users">
                <SalesforceUsers />
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-gray-100">
                  <Activity className="h-5 w-5 text-sf-text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-sf-text-primary">Organization Health</h3>
                  <p className="text-sf-text-secondary">Monitor your Salesforce organization's health</p>
                </div>
              </div>
              <div id="org-health">
                <OrgHealth />
              </div>
            </section>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
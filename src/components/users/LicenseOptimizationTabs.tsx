import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InactiveUsersTab } from './tabs/InactiveUsersTab';
import { IntegrationUsersTab } from './tabs/IntegrationUsersTab';
import { PlatformLicenseTab } from './tabs/PlatformLicenseTab';
import { SalesforceUser } from './utils/userFilters';

interface LicenseOptimizationTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  inactiveUsers: SalesforceUser[];
  integrationUsers: SalesforceUser[];
  platformUsers: SalesforceUser[];
  instanceUrl: string;
  getUserOAuthApps: (userId: string) => string[];
  maskUsername: (username: string) => string;
}

export const LicenseOptimizationTabs = ({
  activeTab,
  setActiveTab,
  inactiveUsers,
  integrationUsers,
  platformUsers,
  instanceUrl,
  getUserOAuthApps,
  maskUsername,
}: LicenseOptimizationTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList>
        <TabsTrigger value="inactive">
          Inactive Users ({inactiveUsers.length})
        </TabsTrigger>
        <TabsTrigger value="integration">
          Integration Users ({integrationUsers.length})
        </TabsTrigger>
        <TabsTrigger value="platform">
          Platform License Users ({platformUsers.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="inactive">
        <InactiveUsersTab 
          users={inactiveUsers}
          instanceUrl={instanceUrl}
          maskUsername={maskUsername}
        />
      </TabsContent>
      <TabsContent value="integration">
        <IntegrationUsersTab 
          users={integrationUsers}
          instanceUrl={instanceUrl}
          getUserOAuthApps={getUserOAuthApps}
          maskUsername={maskUsername}
        />
      </TabsContent>
      <TabsContent value="platform">
        <PlatformLicenseTab 
          instanceUrl={instanceUrl}
          maskUsername={maskUsername}
          users={platformUsers}
        />
      </TabsContent>
    </Tabs>
  );
};
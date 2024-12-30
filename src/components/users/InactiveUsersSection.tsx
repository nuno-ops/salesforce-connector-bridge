import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ChevronUp, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { InactiveUsersTab } from './tabs/InactiveUsersTab';
import { IntegrationUsersTab } from './tabs/IntegrationUsersTab';
import { PlatformLicenseTab } from './tabs/PlatformLicenseTab';

export const InactiveUsersSection = ({ users, instanceUrl, oauthTokens }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inactive');

  useEffect(() => {
    const handleExpand = (event: CustomEvent<{ tabValue: string }>) => {
      setIsOpen(true);
      setActiveTab(event.detail.tabValue);
    };

    window.addEventListener('expandLicenseSection', handleExpand as EventListener);
    return () => {
      window.removeEventListener('expandLicenseSection', handleExpand as EventListener);
    };
  }, []);

  const maskUsername = (username: string) => {
    if (username.length <= 4) return username;
    return username.slice(0, 4) + '*'.repeat(username.length - 4);
  };

  const getUserOAuthApps = (userId: string) => {
    return oauthTokens
      .filter(token => token.UserId === userId)
      .map(token => token.AppName)
      .filter((value, index, self) => self.indexOf(value) === index);
  };

  const handleExport = () => {
    const csvContent = [
      ['Username', 'Last Login', 'User Type', 'Profile', 'Connected Apps'].join(','),
      ...users.map(user => [
        user.Username,
        user.LastLoginDate ? format(new Date(user.LastLoginDate), 'PPp') : 'Never',
        user.UserType,
        user.Profile.Name,
        getUserOAuthApps(user.Id).join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inactive_users.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const inactiveUsers = users.filter(user => {
    const lastLogin = user.LastLoginDate ? new Date(user.LastLoginDate) : null;
    return !lastLogin || (Date.now() - lastLogin.getTime()) > 30 * 24 * 60 * 60 * 1000;
  });

  const integrationUsers = users.filter(user => {
    const oauthApps = getUserOAuthApps(user.Id);
    return oauthApps.length > 0;
  });

  // Calculate platform users count
  const platformUsers = users.filter(user => 
    user.Profile?.UserLicense?.LicenseDefinitionKey === 'SFDC_PLATFORM'
  );

  if (users.length === 0) return null;

  return (
    <div className="space-y-4" id="license-optimization">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">License Optimization</h2>
          <p className="text-muted-foreground">
            Review inactive users and integration opportunities to optimize your Salesforce licenses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="h-8 w-8"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
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
                users={users}
              />
            </TabsContent>
          </Tabs>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
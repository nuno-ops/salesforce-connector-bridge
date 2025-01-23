import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { format } from 'date-fns';
import { LicenseOptimizationHeader } from './LicenseOptimizationHeader';
import { LicenseOptimizationTabs } from './LicenseOptimizationTabs';
import { 
  filterStandardSalesforceUsers, 
  filterInactiveUsers,
  formatLastLoginDate,
  maskUsername,
  type SalesforceUser
} from './utils/userFilters';

export const InactiveUsersSection = ({ 
  users, 
  instanceUrl, 
  oauthTokens 
}: {
  users: SalesforceUser[];
  instanceUrl: string;
  oauthTokens: Array<{
    UserId: string;
    AppName: string;
  }>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inactive');

  useEffect(() => {
    const handleExpand = (event: CustomEvent<{ sectionId: string; tabValue?: string }>) => {
      if (event.detail.sectionId === 'license-optimization') {
        setIsOpen(true);
        if (event.detail.tabValue) {
          setActiveTab(event.detail.tabValue);
        }
      }
    };

    window.addEventListener('expandSection', handleExpand as EventListener);
    return () => {
      window.removeEventListener('expandSection', handleExpand as EventListener);
    };
  }, []);

  const getUserOAuthApps = (userId: string) => {
    return oauthTokens
      .filter(token => token.UserId === userId)
      .map(token => token.AppName)
      .filter((value, index, self) => self.indexOf(value) === index);
  };

  const handleExport = () => {
    const csvContent = [
      ['Username', 'Last Login', 'User Type', 'Profile', 'Connected Apps'].join(','),
      ...standardUsers.map(user => [
        user.Username,
        user.LastLoginDate ? formatLastLoginDate(user.LastLoginDate) : 'Never',
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

  const standardUsers = filterStandardSalesforceUsers(users);
  const inactiveUsers = filterInactiveUsers(standardUsers);
  const integrationUsers = standardUsers.filter(user => {
    const oauthApps = getUserOAuthApps(user.Id);
    return oauthApps.length > 0;
  });
  const platformUsers = standardUsers.filter(user => user.isPlatformEligible);

  if (standardUsers.length === 0) return null;

  return (
    <div className="space-y-4" id="license-optimization">
      <LicenseOptimizationHeader 
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onExport={handleExport}
      />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <LicenseOptimizationTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            inactiveUsers={inactiveUsers}
            integrationUsers={integrationUsers}
            platformUsers={platformUsers}
            instanceUrl={instanceUrl}
            getUserOAuthApps={getUserOAuthApps}
            maskUsername={maskUsername}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
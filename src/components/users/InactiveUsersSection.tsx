import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Breaking down the component into smaller parts
const IntegrationGuidance = () => (
  <Alert className="mt-4">
    <AlertCircle className="h-4 w-4" />
    <div className="ml-2">
      <div className="font-medium">Integration User License Usage Guide</div>
      <AlertDescription className="mt-1 text-sm">
        <p className="mb-2">Integration user licenses are ideal for:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>API-only access for system integrations with tools like:
            <ul className="list-disc pl-4 mt-1">
              <li>Zapier for workflow automation</li>
              <li>Make.com (formerly Integromat) for complex integrations</li>
              <li>MuleSoft for enterprise integration</li>
            </ul>
          </li>
          <li>Data synchronization between systems</li>
          <li>Automated processes and batch operations</li>
        </ul>
      </AlertDescription>
    </div>
  </Alert>
);

const UserTable = ({ users, instanceUrl, getUserOAuthApps, maskUsername }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead>User Type</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.Id}>
            <TableCell>{maskUsername(user.Username)}</TableCell>
            <TableCell>
              {user.LastLoginDate 
                ? format(new Date(user.LastLoginDate), 'PPp')
                : 'Never'}
            </TableCell>
            <TableCell>{user.UserType}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`${instanceUrl}/${user.Id}`, '_blank')}
              >
                View User <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const IntegrationTable = ({ users, instanceUrl, getUserOAuthApps, maskUsername }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>User Type</TableHead>
          <TableHead>Connected Apps</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.Id}>
            <TableCell>{maskUsername(user.Username)}</TableCell>
            <TableCell>{user.UserType}</TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                {getUserOAuthApps(user.Id).map((app, index) => (
                  <Badge key={index} variant="secondary">
                    {app}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`${instanceUrl}/${user.Id}`, '_blank')}
              >
                View User <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

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
              <TabsTrigger value="inactive">Inactive Users ({inactiveUsers.length})</TabsTrigger>
              <TabsTrigger value="integration">Integration Users ({integrationUsers.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="inactive">
              <UserTable 
                users={inactiveUsers}
                instanceUrl={instanceUrl}
                getUserOAuthApps={getUserOAuthApps}
                maskUsername={maskUsername}
              />
            </TabsContent>
            <TabsContent value="integration">
              <IntegrationGuidance />
              <IntegrationTable 
                users={integrationUsers}
                instanceUrl={instanceUrl}
                getUserOAuthApps={getUserOAuthApps}
                maskUsername={maskUsername}
              />
            </TabsContent>
          </Tabs>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
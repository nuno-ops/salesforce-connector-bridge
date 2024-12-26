import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
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

interface SalesforceUser {
  Id: string;
  Username: string;
  LastLoginDate: string;
  UserType: string;
  Profile: {
    Name: string;
  };
}

interface OAuthToken {
  Id: string;
  AppName: string;
  LastUsedDate: string;
  UseCount: number;
  UserId: string;
}

interface InactiveUsersSectionProps {
  users: SalesforceUser[];
  instanceUrl: string;
  oauthTokens: OAuthToken[];
}

export const InactiveUsersSection = ({ users, instanceUrl, oauthTokens }: InactiveUsersSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

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

  if (users.length === 0) return null;

  return (
    <div className="space-y-4">
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Connected Apps</TableHead>
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
import { format, subDays } from 'date-fns';
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

interface SalesforceUser {
  Id: string;
  Username: string;
  LastLoginDate: string;
}

interface InactiveUsersSectionProps {
  users: SalesforceUser[];
  instanceUrl: string;
}

export const InactiveUsersSection = ({ users, instanceUrl }: InactiveUsersSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const maskUsername = (username: string) => {
    if (username.length <= 4) return username;
    return username.slice(0, 4) + '*'.repeat(username.length - 4);
  };

  const handleExport = () => {
    const csvContent = [
      ['Username', 'Last Login'].join(','),
      ...users.map(user => [
        user.Username,
        user.LastLoginDate ? format(new Date(user.LastLoginDate), 'PPp') : 'Never'
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
          <h2 className="text-2xl font-bold">Inactive Users</h2>
          <p className="text-muted-foreground">
            The following users haven't logged into Salesforce for more than 30 days. 
            Consider reviewing their access needs and license assignments.
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
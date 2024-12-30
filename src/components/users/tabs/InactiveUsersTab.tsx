import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { format } from 'date-fns';

interface InactiveUsersTabProps {
  users: any[];
  instanceUrl: string;
  maskUsername: (username: string) => string;
}

export const InactiveUsersTab = ({ users, instanceUrl, maskUsername }: InactiveUsersTabProps) => {
  return (
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
};
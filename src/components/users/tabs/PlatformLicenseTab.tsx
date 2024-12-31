import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from 'date-fns';

interface PlatformLicenseTabProps {
  instanceUrl: string;
  maskUsername: (username: string) => string;
  users: any[];
}

export const PlatformLicenseTab = ({ 
  instanceUrl, 
  maskUsername,
  users
}: PlatformLicenseTabProps) => {
  // Filter platform eligible users
  const platformUsers = users.filter(user => user.isPlatformEligible);

  return (
    <>
      <Alert className="mt-4 mb-4">
        <AlertCircle className="h-4 w-4" />
        <div className="ml-2">
          <div className="font-medium">Platform License Usage Guide</div>
          <AlertDescription className="mt-1 text-sm">
            <p className="mb-2">Platform licenses are ideal for users who:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Only need access to custom objects and apps</li>
              <li>Don't require access to standard CRM features</li>
              <li>Primarily use custom built applications</li>
              <li>Need basic Salesforce platform functionality</li>
            </ul>
          </AlertDescription>
        </div>
      </Alert>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {platformUsers.map((user) => (
              <TableRow key={user.Id}>
                <TableCell>{maskUsername(user.Username)}</TableCell>
                <TableCell>
                  {user.LastLoginDate 
                    ? format(new Date(user.LastLoginDate), 'MMM d, yyyy, h:mm a')
                    : 'Never'}
                </TableCell>
                <TableCell>{user.UserType}</TableCell>
                <TableCell className="text-right">
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
            {platformUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No platform-eligible users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { format } from 'date-fns';

interface PlatformLicenseTabProps {
  users: any[];
  instanceUrl: string;
  maskUsername: (username: string) => string;
}

const PlatformLicenseGuidance = () => (
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
);

export const PlatformLicenseTab = ({ users, instanceUrl, maskUsername }: PlatformLicenseTabProps) => {
  return (
    <>
      <PlatformLicenseGuidance />
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
    </>
  );
};
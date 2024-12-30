import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface IntegrationUsersTabProps {
  users: any[];
  instanceUrl: string;
  maskUsername: (username: string) => string;
  getUserOAuthApps: (userId: string) => string[];
}

const IntegrationGuidance = () => (
  <Alert className="mt-4 mb-4">
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

export const IntegrationUsersTab = ({ 
  users, 
  instanceUrl, 
  maskUsername, 
  getUserOAuthApps 
}: IntegrationUsersTabProps) => {
  return (
    <>
      <IntegrationGuidance />
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
    </>
  );
};
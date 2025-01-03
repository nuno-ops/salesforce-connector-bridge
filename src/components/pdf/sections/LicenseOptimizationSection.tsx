import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface LicenseOptimizationSectionProps {
  inactiveUsers: any[];
  integrationUsers: any[];
  platformUsers: any[];
  getUserOAuthApps: (userId: string) => string[];
  maskUsername: (username: string) => string;
}

export const LicenseOptimizationSection = ({
  inactiveUsers,
  integrationUsers,
  platformUsers,
  getUserOAuthApps,
  maskUsername
}: LicenseOptimizationSectionProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>License Optimization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inactive Users */}
        <div>
          <h3 className="font-semibold mb-4">Inactive Users ({inactiveUsers.length})</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>User Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inactiveUsers.map((user) => (
                <TableRow key={user.Id}>
                  <TableCell>{maskUsername(user.Username)}</TableCell>
                  <TableCell>
                    {user.LastLoginDate 
                      ? format(new Date(user.LastLoginDate), 'PPp')
                      : 'Never'}
                  </TableCell>
                  <TableCell>{user.UserType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Integration Users */}
        <div>
          <h3 className="font-semibold mb-4">Integration Users ({integrationUsers.length})</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Connected Apps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrationUsers.map((user) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Platform License Users */}
        <div>
          <h3 className="font-semibold mb-4">Platform License Candidates ({platformUsers.length})</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Current Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platformUsers.map((user) => (
                <TableRow key={user.Id}>
                  <TableCell>{maskUsername(user.Username)}</TableCell>
                  <TableCell>
                    {user.LastLoginDate 
                      ? format(new Date(user.LastLoginDate), 'PPp')
                      : 'Never'}
                  </TableCell>
                  <TableCell>{user.Profile?.Name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
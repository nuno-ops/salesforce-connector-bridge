import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface LicenseOptimizationSectionProps {
  inactiveUsers: any[];
  integrationUsers: any[];
  platformUsers: any[];
  getUserOAuthApps: (userId: string) => string[];
}

export const LicenseOptimizationSection = ({
  inactiveUsers,
  integrationUsers,
  platformUsers,
  getUserOAuthApps
}: LicenseOptimizationSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>License Optimization</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Inactive Users */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold">Inactive Users ({inactiveUsers.length})</h3>
          {inactiveUsers.map((user, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">{user.Username}</span>
                <Badge variant="destructive">Inactive</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Last login: {user.LastLoginDate ? format(new Date(user.LastLoginDate), 'PPP') : 'Never'}
              </p>
            </div>
          ))}
        </div>

        {/* Integration Users */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold">Integration Users ({integrationUsers.length})</h3>
          {integrationUsers.map((user, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">{user.Username}</span>
                <Badge>Integration Candidate</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Connected Apps: {getUserOAuthApps(user.Id).join(', ')}
              </p>
            </div>
          ))}
        </div>

        {/* Platform License Users */}
        <div className="space-y-4">
          <h3 className="font-semibold">Platform License Candidates ({platformUsers.length})</h3>
          {platformUsers.map((user, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">{user.Username}</span>
                <Badge variant="outline">Platform Eligible</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Current Profile: {user.Profile?.Name}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface DashboardTabsProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  users: any[];
  oauthTokens: any[];
  savingsBreakdown: any[];
  totalSavings: number;
}

export const DashboardTabs = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits,
  users,
  oauthTokens,
  savingsBreakdown,
  totalSavings,
}: DashboardTabsProps) => {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="licenses">Licenses</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Organization Overview</h2>
          <p>Total Users: {users.length}</p>
          <p>Total User Licenses: {userLicenses.length}</p>
          <p>Total Package Licenses: {packageLicenses.length}</p>
          <p>Potential Savings: ${totalSavings.toLocaleString()}</p>
        </Card>
      </TabsContent>
      <TabsContent value="licenses" className="space-y-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">License Details</h2>
          <div className="space-y-2">
            <p>User Licenses: {userLicenses.length}</p>
            <p>Package Licenses: {packageLicenses.length}</p>
            <p>Permission Set Licenses: {permissionSetLicenses.length}</p>
          </div>
        </Card>
      </TabsContent>
      <TabsContent value="users" className="space-y-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">User Details</h2>
          <div className="space-y-2">
            <p>Total Users: {users.length}</p>
            <p>OAuth Tokens: {oauthTokens.length}</p>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
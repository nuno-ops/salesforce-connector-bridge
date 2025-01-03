import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from "@/components/org-health/utils";
import { format } from 'date-fns';
import { calculateMonthlyMetrics } from "../org-health/MetricsCalculator";
import { DollarSign } from "lucide-react";
import { useSavingsCalculations } from "../cost-savings/SavingsCalculator";
import { useOrganizationData } from "../cost-savings/hooks/useOrganizationData";

interface PrintableReportProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  sandboxes: any[];
  limits: any;
  metrics: any;
}

export const PrintableReport = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  limits,
  metrics
}: PrintableReportProps) => {
  const formattedUserLicenses = formatLicenseData(userLicenses);
  const formattedPackageLicenses = formatPackageLicenseData(packageLicenses);
  const formattedPermissionSetLicenses = formatPermissionSetLicenseData(permissionSetLicenses);
  const { leadConversion, oppWinRate } = calculateMonthlyMetrics(metrics);

  // Get savings data
  const {
    licensePrice,
    users,
    oauthTokens
  } = useOrganizationData();

  const { totalSavings, savingsBreakdown } = useSavingsCalculations({
    users,
    oauthTokens,
    licensePrice,
    sandboxes,
    storageUsage: limits?.StorageUsed || 0,
    userLicenses
  });

  return (
    <div className="p-8 space-y-8 bg-white min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-sf-blue mb-2">Salesforce Organization Report</h1>
        <p className="text-muted-foreground">Generated on {format(new Date(), 'PPP')}</p>
      </div>

      {/* Cost Savings Summary */}
      <Card className="bg-gradient-to-r from-sf-blue to-sf-hover text-white mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Potential Annual Savings</h2>
              <p className="text-4xl font-bold">${totalSavings.toLocaleString()}</p>
            </div>
            <DollarSign className="h-12 w-12 opacity-75" />
          </div>
          <div className="space-y-2">
            {savingsBreakdown.map((item, index) => (
              item.amount > 0 && (
                <div key={index} className="text-white/90">
                  <div className="flex justify-between items-center">
                    <span>{item.title}</span>
                    <span>${item.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-white/70">{item.details}</p>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* License Usage Section */}
      <Card>
        <CardHeader>
          <CardTitle>License Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Licenses */}
          <div>
            <h3 className="font-semibold mb-4">User Licenses</h3>
            <div className="grid gap-4">
              {formattedUserLicenses.map((license, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{license.name}</span>
                    <span>{license.used} / {license.total}</span>
                  </div>
                  <Progress value={(license.used / license.total) * 100} />
                </div>
              ))}
            </div>
          </div>

          {/* Package Licenses */}
          <div>
            <h3 className="font-semibold mb-4">Package Licenses</h3>
            <div className="grid gap-4">
              {formattedPackageLicenses.map((license, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{license.name}</span>
                    <Badge variant={license.status === 'Active' ? 'default' : 'secondary'}>
                      {license.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Usage</span>
                    <span>{license.used} / {license.total}</span>
                  </div>
                  <Progress value={(license.used / license.total) * 100} />
                </div>
              ))}
            </div>
          </div>

          {/* Permission Set Licenses */}
          <div>
            <h3 className="font-semibold mb-4">Permission Set Licenses</h3>
            <div className="grid gap-4">
              {formattedPermissionSetLicenses.map((license, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{license.name}</span>
                    <span>{license.used} / {license.total}</span>
                  </div>
                  <Progress value={(license.used / license.total) * 100} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License Optimization */}
      <Card>
        <CardHeader>
          <CardTitle>License Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.filter(user => !user.LastLoginDate || new Date(user.LastLoginDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
              .map((user, index) => (
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
        </CardContent>
      </Card>

      {/* Organization Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {/* Data Storage */}
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Data Storage</h3>
              <div className="flex justify-between mb-2">
                <span>Usage</span>
                <span>
                  {limits?.DataStorageMB?.Max - limits?.DataStorageMB?.Remaining} / {limits?.DataStorageMB?.Max} MB
                </span>
              </div>
              <Progress 
                value={((limits?.DataStorageMB?.Max - limits?.DataStorageMB?.Remaining) / limits?.DataStorageMB?.Max) * 100} 
              />
            </div>

            {/* File Storage */}
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">File Storage</h3>
              <div className="flex justify-between mb-2">
                <span>Usage</span>
                <span>
                  {limits?.FileStorageMB?.Max - limits?.FileStorageMB?.Remaining} / {limits?.FileStorageMB?.Max} MB
                </span>
              </div>
              <Progress 
                value={((limits?.FileStorageMB?.Max - limits?.FileStorageMB?.Remaining) / limits?.FileStorageMB?.Max) * 100} 
              />
            </div>

            {/* API Requests */}
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">API Requests</h3>
              <div className="flex justify-between mb-2">
                <span>Daily Usage</span>
                <span>
                  {limits?.DailyApiRequests?.Max - limits?.DailyApiRequests?.Remaining} / {limits?.DailyApiRequests?.Max}
                </span>
              </div>
              <Progress 
                value={((limits?.DailyApiRequests?.Max - limits?.DailyApiRequests?.Remaining) / limits?.DailyApiRequests?.Max) * 100} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Operational Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Lead Conversion Rate */}
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Lead Conversion Rate (Last 6 Months)</h3>
              <div className="space-y-2">
                {leadConversion.map((data, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{data.month}</span>
                    <span>{data.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunity Win Rate */}
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Opportunity Win Rate (Last 6 Months)</h3>
              <div className="space-y-2">
                {oppWinRate.map((data, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{data.month}</span>
                    <span>{data.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sandboxes */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sandboxes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {sandboxes.map((sandbox) => (
              <div key={sandbox.Id} className="border p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{sandbox.SandboxName}</span>
                  <Badge>{sandbox.LicenseType}</Badge>
                </div>
                {sandbox.Description && (
                  <p className="text-sm text-muted-foreground">{sandbox.Description}</p>
                )}
              </div>
            ))}
            {sandboxes.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No active sandboxes found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
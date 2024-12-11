import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CostSavingsReportProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  inactiveUsers: any[];
  sandboxes: any[];
  apiUsage: number;
  storageUsage: number;
}

export const CostSavingsReport = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  inactiveUsers,
  sandboxes,
  apiUsage,
  storageUsage
}: CostSavingsReportProps) => {
  const recommendations: string[] = [];

  // Check for inactive users
  if (inactiveUsers.length > 0) {
    recommendations.push(
      `Consider deactivating ${inactiveUsers.length} users who haven't logged in for over a month to reduce license costs.`
    );
  }

  // Check license utilization
  userLicenses.forEach(license => {
    const unusedLicenses = license.total - license.used;
    if (unusedLicenses > 0) {
      recommendations.push(
        `You have ${unusedLicenses} unused ${license.name} licenses. Consider reducing these to save on license costs.`
      );
    }
  });

  // Check package license utilization
  packageLicenses.forEach(license => {
    const unusedLicenses = license.total - license.used;
    if (unusedLicenses > 2) {
      recommendations.push(
        `You have ${unusedLicenses} unused ${license.name} package licenses. Consider optimizing these allocations.`
      );
    }
  });

  // Check sandbox usage
  if (sandboxes.length > 0) {
    recommendations.push(
      `Review your ${sandboxes.length} sandboxes - consider cleaning up unused ones to reduce maintenance and storage costs.`
    );
  }

  // Check API usage
  if (apiUsage < 25) {
    recommendations.push(
      "Your API usage is relatively low. Consider if you need all current API-enabled integrations."
    );
  }

  // Check storage usage
  if (storageUsage < 30) {
    recommendations.push(
      "Storage usage is low. Consider implementing a data archival strategy to maintain optimal storage costs."
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Cost Savings Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            <ul className="list-disc pl-6 space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {rec}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No immediate cost-saving opportunities identified. Your Salesforce instance appears to be well-optimized.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
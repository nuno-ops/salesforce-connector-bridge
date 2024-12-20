import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CostSavingsReportProps {
  userLicenses: Array<{
    name: string;
    total: number;
    used: number;
  }>;
  packageLicenses: Array<{
    name: string;
    total: number;
    used: number;
    status: string;
  }>;
  permissionSetLicenses: Array<{
    name: string;
    total: number;
    used: number;
  }>;
  inactiveUsers: any[];
  sandboxes: any[];
  apiUsage: number;
  storageUsage: number;
  contracts: Array<{
    Id: string;
    StartDate: string;
    EndDate: string;
    SalesforceContractStatus: string;
    SubscriptionDaysLeft: number;
  }>;
  invoices: Array<{
    Id: string;
    DueDate: string;
    SalesforceInvoiceStatus: string;
    TotalAmount: number;
    SalesforceContractId: string;
  }>;
}

export const CostSavingsReport = ({
  userLicenses,
  packageLicenses,
  permissionSetLicenses,
  sandboxes,
  apiUsage,
  storageUsage,
  contracts,
  invoices
}: CostSavingsReportProps) => {
  const recommendations: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }> = [];

  // Check Salesforce user licenses (excluding free licenses like Chatter)
  const paidLicenses = userLicenses.filter(license => {
    const name = license.name.toLowerCase();
    return (
      !name.includes('chatter') &&
      !name.includes('guest') &&
      !name.includes('high volume') &&
      license.total > 0
    );
  });

  paidLicenses.forEach(license => {
    const unusedLicenses = license.total - license.used;
    const unusedPercentage = (unusedLicenses / license.total) * 100;
    
    if (unusedPercentage >= 20 && unusedLicenses >= 2) {
      recommendations.push({
        title: "Optimize User Licenses",
        description: `You have ${unusedLicenses} unused ${license.name} licenses (${unusedPercentage.toFixed(0)}% of total). Consider reducing these at your next renewal to save on license costs.`,
        priority: unusedPercentage >= 30 ? 'high' : 'medium'
      });
    }
  });

  // Check paid package licenses
  packageLicenses.forEach(license => {
    const unusedLicenses = license.total - license.used;
    const unusedPercentage = (unusedLicenses / license.total) * 100;
    
    if (unusedPercentage >= 25 && unusedLicenses >= 3) {
      recommendations.push({
        title: "Review AppExchange Subscriptions",
        description: `${license.name} package has ${unusedLicenses} unused licenses (${unusedPercentage.toFixed(0)}% of total). Consider adjusting the subscription tier.`,
        priority: unusedPercentage >= 40 ? 'high' : 'medium'
      });
    }
  });

  // Check sandbox usage
  if (sandboxes.length > 0) {
    const fullSandboxes = sandboxes.filter(sb => 
      sb.LicenseType.toLowerCase().includes('full')
    );
    
    if (fullSandboxes.length > 1) {
      recommendations.push({
        title: "Optimize Sandbox Usage",
        description: `You have ${fullSandboxes.length} full sandboxes. Consider downgrading some to partial or developer sandboxes to reduce costs.`,
        priority: 'high'
      });
    }
  }

  // Check API usage
  if (apiUsage < 25) {
    recommendations.push({
      title: "Review API-Enabled User Licenses",
      description: "Your API usage is significantly below average. Consider reviewing API-enabled user licenses and downgrade where possible.",
      priority: 'medium'
    });
  }

  // Check storage optimization opportunities
  if (storageUsage > 75) {
    recommendations.push({
      title: "Optimize Storage Usage",
      description: "Storage usage is high. Consider implementing a data archival strategy or reviewing attachment storage policies to avoid additional storage costs.",
      priority: 'high'
    });
  }

  // Check contract renewal timing
  const activeContracts = contracts?.filter(
    contract => contract.SalesforceContractStatus === 'Active'
  );

  if (activeContracts?.length > 0) {
    const nearingRenewal = activeContracts.filter(
      contract => contract.SubscriptionDaysLeft <= 90
    );

    if (nearingRenewal.length > 0) {
      recommendations.push({
        title: "Contract Renewal Opportunity",
        description: `${nearingRenewal.length} contract(s) up for renewal in the next 90 days. Review current usage patterns and consider consolidating or adjusting license types before renewal.`,
        priority: 'high'
      });
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Cost Optimization Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations
                .sort((a, b) => {
                  const priorityOrder = { high: 0, medium: 1, low: 2 };
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .map((rec, index) => (
                  <Alert key={index} variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4" />
                    <div className="ml-2">
                      <div className="font-medium">{rec.title}</div>
                      <AlertDescription className="mt-1 text-sm">
                        {rec.description}
                      </AlertDescription>
                    </div>
                  </Alert>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No immediate cost optimization opportunities identified. Your Salesforce instance appears to be well-optimized.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
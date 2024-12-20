import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { LicenseRecommendation } from "./cost-savings/LicenseRecommendation";
import { PackageRecommendation } from "./cost-savings/PackageRecommendation";
import { ContractRecommendation } from "./cost-savings/ContractRecommendation";

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
  // Filter out free licenses like Chatter
  const paidLicenses = userLicenses.filter(license => {
    const name = license.name.toLowerCase();
    return (
      !name.includes('chatter') &&
      !name.includes('guest') &&
      !name.includes('high volume') &&
      license.total > 0
    );
  });

  // Get licenses with significant unused allocation
  const licenseRecommendations = paidLicenses
    .filter(license => {
      const unusedLicenses = license.total - license.used;
      const unusedPercentage = (unusedLicenses / license.total) * 100;
      return unusedPercentage >= 20 && unusedLicenses >= 2;
    })
    .map(license => ({
      license,
      priority: ((license.total - license.used) / license.total) >= 0.3 ? 'high' : 'medium'
    }));

  // Get package recommendations
  const packageRecommendations = packageLicenses
    .filter(pkg => {
      const unusedLicenses = pkg.total - pkg.used;
      const unusedPercentage = (unusedLicenses / pkg.total) * 100;
      return unusedPercentage >= 25 && unusedLicenses >= 3;
    })
    .map(pkg => ({
      package: pkg,
      priority: ((pkg.total - pkg.used) / pkg.total) >= 0.4 ? 'high' : 'medium'
    }));

  // Check sandbox usage
  const fullSandboxes = sandboxes.filter(sb => 
    sb.LicenseType.toLowerCase().includes('full')
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Cost Optimization Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Contract Recommendations */}
          <ContractRecommendation 
            contracts={contracts} 
            invoices={invoices}
            userLicenses={userLicenses}
          />

          {/* License Recommendations */}
          {licenseRecommendations.map((rec, index) => (
            <LicenseRecommendation
              key={`license-${index}`}
              license={rec.license}
              priority={rec.priority}
            />
          ))}

          {/* Package Recommendations */}
          {packageRecommendations.map((rec, index) => (
            <PackageRecommendation
              key={`package-${index}`}
              package={rec.package}
              priority={rec.priority}
            />
          ))}

          {/* Sandbox Recommendations */}
          {fullSandboxes.length > 1 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <div className="font-medium">Optimize Sandbox Usage</div>
                <AlertDescription className="mt-1 text-sm">
                  You have {fullSandboxes.length} full sandboxes. Consider downgrading some to partial 
                  or developer sandboxes to reduce costs. Full sandboxes are typically only needed for 
                  final testing phases and complete data copies.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Storage Recommendations */}
          {storageUsage > 75 && (
            <Alert variant={storageUsage > 90 ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <div className="font-medium">Optimize Storage Usage</div>
                <AlertDescription className="mt-1 text-sm">
                  Storage usage is at {storageUsage}%. Consider implementing a data archival strategy 
                  or reviewing attachment storage policies to avoid additional storage costs.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* No Recommendations Message */}
          {licenseRecommendations.length === 0 && 
           packageRecommendations.length === 0 && 
           fullSandboxes.length <= 1 && 
           storageUsage <= 75 && 
           contracts.filter(c => c.SubscriptionDaysLeft <= 90).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No immediate cost optimization opportunities identified. Your Salesforce instance appears 
              to be well-optimized.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
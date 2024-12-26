import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ContractRecommendation } from "./cost-savings/ContractRecommendation";
import { groupLicensesByCategory, LicenseData } from "./cost-savings/utils/licenseTypes";
import { RecommendationTabs } from "./cost-savings/report/RecommendationTabs";
import { PackageRecommendationsSection } from "./cost-savings/report/PackageRecommendationsSection";
import { SandboxStorageSection } from "./cost-savings/report/SandboxStorageSection";

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
  // Group licenses by category
  const categorizedLicenses = groupLicensesByCategory(
    userLicenses.map(license => ({
      name: license.name,
      total: license.total,
      used: license.used
    }))
  );

  // Get recommendations for each category
  const getLicenseRecommendations = (licenses: LicenseData[]) => {
    return licenses.filter(license => {
      const unusedLicenses = license.total - license.used;
      const unusedPercentage = (unusedLicenses / license.total) * 100;
      return unusedPercentage >= 20 && unusedLicenses >= 2;
    }).map(license => ({
      license,
      priority: ((license.total - license.used) / license.total) >= 0.3 ? 'high' as const : 'medium' as const
    }));
  };

  // Get package recommendations
  const packageRecommendations = packageLicenses
    .filter(pkg => {
      const unusedLicenses = pkg.total - pkg.used;
      const unusedPercentage = (unusedLicenses / pkg.total) * 100;
      return unusedPercentage >= 25 && unusedLicenses >= 3;
    })
    .map(pkg => ({
      package: pkg,
      priority: ((pkg.total - pkg.used) / pkg.total) >= 0.4 ? 'high' as const : 'medium' as const
    }));

  // Check sandbox usage
  const fullSandboxes = sandboxes.filter(sb => 
    sb.LicenseType.toLowerCase().includes('full')
  );

  return (
    <Card className="mb-8 shadow-lg border-t-4 border-t-sf-blue">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sf-blue to-sf-hover bg-clip-text text-transparent">
          Cost Optimization Recommendations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Review and act on opportunities to optimize your Salesforce investment
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Contract Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ContractRecommendation 
              contracts={contracts} 
              invoices={invoices}
              userLicenses={userLicenses}
            />
          </motion.div>

          {/* License Recommendations by Category */}
          <RecommendationTabs 
            categorizedLicenses={categorizedLicenses}
            getLicenseRecommendations={getLicenseRecommendations}
          />

          {/* Package Recommendations */}
          <PackageRecommendationsSection 
            packageRecommendations={packageRecommendations}
          />

          {/* Sandbox and Storage Recommendations */}
          <SandboxStorageSection 
            fullSandboxes={fullSandboxes}
            storageUsage={storageUsage}
          />
        </div>
      </CardContent>
    </Card>
  );
};
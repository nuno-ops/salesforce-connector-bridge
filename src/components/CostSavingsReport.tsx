import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { LicenseRecommendation } from "./cost-savings/LicenseRecommendation";
import { PackageRecommendation } from "./cost-savings/PackageRecommendation";
import { ContractRecommendation } from "./cost-savings/ContractRecommendation";
import { groupLicensesByCategory, LicenseData } from "./cost-savings/utils/licenseTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

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

  // Get the first category key for default tab
  const defaultCategory = Object.keys(categorizedLicenses)[0]?.toLowerCase().replace(/\s+/g, '-') || 'other-licenses';

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
          <Tabs defaultValue={defaultCategory} className="w-full">
            <TabsList className="w-full grid grid-cols-3 lg:grid-cols-5 h-auto gap-2 bg-muted/50 p-1">
              {Object.keys(categorizedLicenses).map(category => (
                <TabsTrigger 
                  key={category} 
                  value={category.toLowerCase().replace(/\s+/g, '-')}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(categorizedLicenses).map(([category, licenses]) => {
              const recommendations = getLicenseRecommendations(licenses);
              return (
                <TabsContent 
                  key={category} 
                  value={category.toLowerCase().replace(/\s+/g, '-')}
                  className="space-y-4 mt-4"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {recommendations.length > 0 ? (
                      recommendations.map((rec, index) => (
                        <motion.div
                          key={`${category}-license-${index}`}
                          initial={{ x: -20 }}
                          animate={{ x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <LicenseRecommendation
                            license={rec.license}
                            priority={rec.priority}
                          />
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No optimization opportunities found for {category} licenses.
                        </p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
              );
            })}
          </Tabs>

          {/* Package Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {packageRecommendations.map((rec, index) => (
              <PackageRecommendation
                key={`package-${index}`}
                package={rec.package}
                priority={rec.priority}
              />
            ))}
          </motion.div>

          {/* Sandbox and Storage Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            {fullSandboxes.length > 1 && (
              <Alert variant="destructive" className="border-l-4 border-l-destructive">
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

            {storageUsage > 75 && (
              <Alert 
                variant={storageUsage > 90 ? 'destructive' : 'default'}
                className={`border-l-4 ${
                  storageUsage > 90 ? 'border-l-destructive' : 'border-l-sf-blue'
                }`}
              >
                <AlertCircle className="h-4 w-4" />
                <div className="ml-2">
                  <div className="font-medium">Optimize Storage Usage</div>
                  <AlertDescription className="mt-1 text-sm">
                    Storage usage is at {storageUsage.toFixed(2)}%. Consider implementing a data archival strategy 
                    or reviewing attachment storage policies to avoid additional storage costs.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

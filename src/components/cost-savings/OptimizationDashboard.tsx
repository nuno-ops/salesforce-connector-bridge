import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, AlertCircle } from "lucide-react";

interface OptimizationDashboardProps {
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
  sandboxes: any[];
  storageUsage: number;
}

export const OptimizationDashboard = ({
  userLicenses,
  packageLicenses,
  sandboxes,
  storageUsage
}: OptimizationDashboardProps) => {
  // Calculate potential savings
  const calculateLicenseSavings = () => {
    // Assume average license cost of $150/month for estimation
    const monthlyLicenseCost = 150;
    let totalUnused = 0;

    userLicenses.forEach(license => {
      const unused = license.total - license.used;
      if (unused > 0) totalUnused += unused;
    });

    return totalUnused * monthlyLicenseCost * 12; // Annual savings
  };

  const calculateSandboxSavings = () => {
    // Assume full sandbox costs $5000/month more than partial
    const fullSandboxes = sandboxes.filter(sb => 
      sb.LicenseType.toLowerCase().includes('full')
    ).length;
    
    // Recommend keeping only one full sandbox
    const excessFullSandboxes = Math.max(0, fullSandboxes - 1);
    return excessFullSandboxes * 5000 * 12; // Annual savings
  };

  const calculateStorageSavings = () => {
    // If storage usage is high, estimate savings from optimization
    if (storageUsage > 75) {
      // Assume $250 per GB per month savings for optimization
      const estimatedGBSavings = 2; // Conservative estimate
      return estimatedGBSavings * 250 * 12;
    }
    return 0;
  };

  const totalPotentialSavings = 
    calculateLicenseSavings() + 
    calculateSandboxSavings() + 
    calculateStorageSavings();

  const quickWins = [
    {
      title: "License Optimization",
      savings: calculateLicenseSavings(),
      effort: "Medium",
      timeframe: "1-2 weeks",
      description: "Redistribute or remove unused licenses"
    },
    {
      title: "Sandbox Consolidation",
      savings: calculateSandboxSavings(),
      effort: "Easy",
      timeframe: "1 week",
      description: "Convert excess full sandboxes to partial"
    },
    {
      title: "Storage Optimization",
      savings: calculateStorageSavings(),
      effort: "Medium",
      timeframe: "2-3 weeks",
      description: "Archive old data and optimize attachments"
    }
  ].filter(win => win.savings > 0)
   .sort((a, b) => b.savings - a.savings);

  return (
    <div className="space-y-6 mb-8">
      {/* Total Savings Card */}
      <Card className="bg-gradient-to-r from-sf-blue to-sf-hover">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Potential Annual Savings
              </h2>
              <p className="text-4xl font-bold text-white">
                ${totalPotentialSavings.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-white opacity-75" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Wins Section */}
      {quickWins.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Wins
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickWins.map((win, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{win.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        win.effort === 'Easy' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {win.effort}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-sf-blue">
                      ${win.savings.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">{win.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <AlertCircle className="h-4 w-4" />
                      {win.timeframe} to implement
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

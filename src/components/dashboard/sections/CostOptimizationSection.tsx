import { OptimizationDashboard } from "@/components/cost-savings/OptimizationDashboard";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface CostOptimizationSectionProps {
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

export const CostOptimizationSection = ({
  userLicenses,
  packageLicenses,
  sandboxes,
  storageUsage
}: CostOptimizationSectionProps) => {
  return (
    <section className="bg-gradient-to-r from-sf-blue/5 to-sf-hover/5 rounded-xl shadow-lg border border-sf-blue/10 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-full bg-sf-blue/10">
          <TrendingUp className="h-7 w-7 text-sf-blue" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-sf-blue">Cost Optimization</h2>
          <p className="text-sf-text-secondary">Analyze and optimize your Salesforce costs</p>
        </div>
      </div>
      <OptimizationDashboard
        userLicenses={userLicenses}
        packageLicenses={packageLicenses}
        sandboxes={sandboxes}
        storageUsage={storageUsage}
      />
    </section>
  );
};
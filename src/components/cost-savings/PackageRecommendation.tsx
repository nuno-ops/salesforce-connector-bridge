import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PackageInfo {
  name: string;
  total: number;
  used: number;
  status: string;
}

interface PackageRecommendationProps {
  package: PackageInfo;
  priority: 'high' | 'medium' | 'low';
}

export const PackageRecommendation = ({ package: pkg, priority }: PackageRecommendationProps) => {
  const unusedLicenses = pkg.total - pkg.used;
  const unusedPercentage = (unusedLicenses / pkg.total) * 100;

  return (
    <Alert variant={priority === 'high' ? 'destructive' : 'default'}>
      <AlertCircle className="h-4 w-4" />
      <div className="ml-2">
        <div className="font-medium">Review {pkg.name} Package Subscription</div>
        <AlertDescription className="mt-1 text-sm">
          {pkg.name} package has {unusedLicenses} unused licenses ({unusedPercentage.toFixed(0)}% of total). 
          Consider adjusting the subscription tier or redistributing licenses to other teams.
        </AlertDescription>
      </div>
    </Alert>
  );
};
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getCategoryRecommendations } from "./utils/licenseTypes";

interface LicenseInfo {
  name: string;
  total: number;
  used: number;
  category?: string;
}

interface LicenseRecommendationProps {
  license: LicenseInfo;
  priority: 'high' | 'medium' | 'low';
}

export const LicenseRecommendation = ({ license, priority }: LicenseRecommendationProps) => {
  const unusedLicenses = license.total - license.used;
  const unusedPercentage = (unusedLicenses / license.total) * 100;
  const categoryRecommendations = license.category ? getCategoryRecommendations(license.category) : null;

  return (
    <Alert variant={priority === 'high' ? 'destructive' : 'default'}>
      <AlertCircle className="h-4 w-4" />
      <div className="ml-2">
        <div className="font-medium">Optimize {license.name} Licenses</div>
        <AlertDescription className="mt-1 text-sm space-y-2">
          <p>
            You have {unusedLicenses} unused {license.name} licenses ({unusedPercentage.toFixed(0)}% of total).
          </p>
          
          {categoryRecommendations && (
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="underutilized">
                <AccordionTrigger className="text-sm font-medium">
                  Underutilization Analysis
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 mt-2 space-y-1">
                    {categoryRecommendations.underutilized.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="optimization">
                <AccordionTrigger className="text-sm font-medium">
                  Cost Optimization Steps
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 mt-2 space-y-1">
                    {categoryRecommendations.costOptimization.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="practices">
                <AccordionTrigger className="text-sm font-medium">
                  Best Practices
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-4 mt-2 space-y-1">
                    {categoryRecommendations.bestPractices.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};
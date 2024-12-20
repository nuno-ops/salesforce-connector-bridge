import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LicenseInfo {
  name: string;
  total: number;
  used: number;
}

interface LicenseRecommendationProps {
  license: LicenseInfo;
  priority: 'high' | 'medium' | 'low';
}

const LICENSE_USE_CASES = {
  'Salesforce Identity': [
    'Single Sign-On (SSO) access to connected apps',
    'Basic Salesforce authentication',
    'Custom authentication provider integration',
    'Employee portal access',
    'Partner community authentication',
    'Multi-factor authentication management'
  ],
  'Salesforce Integration': [
    'API-only access for system integrations with tools like:',
    '- Zapier for workflow automation',
    '- Make.com (formerly Integromat) for complex integrations',
    '- MuleSoft for enterprise integration',
    'Data synchronization between systems',
    'Automated processes and batch operations'
  ],
  'Salesforce Platform': [
    'Access to custom objects and apps',
    'Limited standard object access',
    'Basic Salesforce functionality'
  ]
};

export const LicenseRecommendation = ({ license, priority }: LicenseRecommendationProps) => {
  const unusedLicenses = license.total - license.used;
  const unusedPercentage = (unusedLicenses / license.total) * 100;
  const useCases = LICENSE_USE_CASES[license.name as keyof typeof LICENSE_USE_CASES];

  return (
    <Alert variant={priority === 'high' ? 'destructive' : 'default'}>
      <AlertCircle className="h-4 w-4" />
      <div className="ml-2">
        <div className="font-medium">Optimize {license.name} Licenses</div>
        <AlertDescription className="mt-1 text-sm space-y-2">
          <p>
            You have {unusedLicenses} unused {license.name} licenses ({unusedPercentage.toFixed(0)}% of total).
          </p>
          {useCases && (
            <div>
              <p className="font-medium mt-2">Consider using these licenses for:</p>
              <ul className="list-disc pl-4 mt-1">
                {useCases.map((useCase, index) => (
                  <li key={index}>{useCase}</li>
                ))}
              </ul>
            </div>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Contract {
  Id: string;
  StartDate: string;
  EndDate: string;
  SalesforceContractStatus: string;
  SubscriptionDaysLeft: number;
}

interface Invoice {
  Id: string;
  DueDate: string;
  SalesforceInvoiceStatus: string;
  TotalAmount: number;
  SalesforceContractId: string;
}

interface ContractRecommendationProps {
  contracts: Contract[];
  invoices: Invoice[];
  userLicenses: Array<{
    name: string;
    total: number;
    used: number;
  }>;
}

export const ContractRecommendation = ({ contracts, invoices, userLicenses }: ContractRecommendationProps) => {
  const nearingRenewal = contracts.filter(
    contract => contract.SalesforceContractStatus === 'Active' && contract.SubscriptionDaysLeft <= 90
  );

  if (nearingRenewal.length === 0) return null;

  // Calculate potential savings based on license costs
  const calculatePotentialSavings = () => {
    let totalSavings = 0;
    const contractInvoices = invoices.filter(inv => 
      nearingRenewal.some(contract => contract.Id === inv.SalesforceContractId)
    );

    // Calculate average cost per user
    const totalAmount = contractInvoices.reduce((sum, inv) => sum + inv.TotalAmount, 0);
    const totalLicenses = userLicenses.reduce((sum, lic) => sum + lic.total, 0);
    const avgCostPerUser = totalAmount / totalLicenses;

    // Estimate savings from optimizing licenses
    userLicenses.forEach(license => {
      const unusedLicenses = license.total - license.used;
      if (unusedLicenses > 0) {
        // Assume 30% savings when switching to Identity/Integration licenses
        totalSavings += (unusedLicenses * avgCostPerUser * 0.3);
      }
    });

    return totalSavings;
  };

  const potentialSavings = calculatePotentialSavings();

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <div className="ml-2">
        <div className="font-medium">Contract Renewal Opportunity</div>
        <AlertDescription className="mt-1 text-sm space-y-2">
          <p>
            {nearingRenewal.length} contract(s) up for renewal in the next 90 days. 
            Review current usage patterns before renewal.
          </p>
          {potentialSavings > 0 && (
            <p>
              Potential annual savings of approximately ${potentialSavings.toFixed(2)} by optimizing 
              license types (e.g., switching unused full licenses to Identity or Integration licenses).
            </p>
          )}
          <div>
            <p className="font-medium">Recommended actions:</p>
            <ul className="list-disc pl-4 mt-1">
              <li>Review inactive users and consider switching to Identity licenses</li>
              <li>Evaluate API-only integrations for Integration license eligibility</li>
              <li>Consider bulk license purchases for additional discounts</li>
            </ul>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};
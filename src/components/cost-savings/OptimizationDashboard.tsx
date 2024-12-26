import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SavingsSummaryCard } from "./SavingsSummaryCard";
import { LicenseCostInput } from "./LicenseCostInput";
import { RecommendationsSection } from "./RecommendationsSection";
import {
  calculateInactiveUserSavings,
  calculateIntegrationUserSavings,
  calculateSandboxSavings,
  calculateStorageSavings
} from "./utils/savingsCalculations";

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
  const [licensePrice, setLicensePrice] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);
  const [oauthTokens, setOauthTokens] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const access_token = localStorage.getItem('sf_access_token');
        const instance_url = localStorage.getItem('sf_instance_url');

        if (!access_token || !instance_url) {
          console.log('Missing Salesforce credentials');
          return;
        }

        // Fetch users and OAuth tokens
        const { data, error } = await supabase.functions.invoke('salesforce-users', {
          body: { access_token, instance_url }
        });

        if (error) throw error;

        setUsers(data.users);
        setOauthTokens(data.oauthTokens);

        // Try to fetch license price from settings
        const { data: orgData, error: orgError } = await supabase.functions.invoke('salesforce-org', {
          body: { access_token, instance_url }
        });

        if (orgError) throw orgError;

        if (orgData?.settings?.license_cost_per_user) {
          setLicensePrice(orgData.settings.license_cost_per_user);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch organization data"
        });
      }
    };

    fetchData();
  }, [toast]);

  const scrollToLicenseOptimization = (tabValue: string) => {
    const element = document.getElementById('license-optimization');
    if (element) {
      // First, dispatch the event to expand the section
      const event = new CustomEvent('expandLicenseSection', { detail: { tabValue } });
      window.dispatchEvent(event);

      // Add a delay to allow the section to expand before scrolling
      setTimeout(() => {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - 100;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }, 150); // Increased delay to ensure expansion completes
    }
  };

  // Calculate savings
  const inactiveUserSavings = calculateInactiveUserSavings(users, licensePrice || 0);
  const integrationUserSavings = calculateIntegrationUserSavings(users, oauthTokens, licensePrice || 0);
  const sandboxSavingsCalc = calculateSandboxSavings(sandboxes);
  const storageSavingsCalc = calculateStorageSavings(storageUsage);

  const totalSavings = 
    inactiveUserSavings.savings +
    integrationUserSavings.savings +
    sandboxSavingsCalc.savings +
    storageSavingsCalc.savings;

  const savingsBreakdown = [
    {
      title: "Inactive User Licenses",
      amount: inactiveUserSavings.savings,
      details: `${inactiveUserSavings.count} users inactive for >30 days`,
      viewAction: () => scrollToLicenseOptimization('inactive')
    },
    {
      title: "Integration User Optimization",
      amount: integrationUserSavings.savings,
      details: `${integrationUserSavings.count} users could be converted to integration users`,
      viewAction: () => scrollToLicenseOptimization('integration')
    },
    {
      title: "Sandbox Optimization",
      amount: sandboxSavingsCalc.savings,
      details: `${sandboxSavingsCalc.count} excess full sandboxes could be converted`
    },
    {
      title: "Storage Optimization",
      amount: storageSavingsCalc.savings,
      details: `Potential ${storageSavingsCalc.potentialGBSavings}GB reduction in storage`
    }
  ];

  return (
    <div className="space-y-6 mb-8">
      <LicenseCostInput 
        licensePrice={licensePrice}
        onPriceChange={setLicensePrice}
      />

      <SavingsSummaryCard 
        totalSavings={totalSavings}
        breakdownItems={savingsBreakdown}
      />

      <RecommendationsSection items={savingsBreakdown} />
    </div>
  );
};

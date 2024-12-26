import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SavingsSummaryCard } from "./SavingsSummaryCard";
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
  const [licensePrice, setLicensePrice] = useState<number>(100);
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

  // Calculate savings
  const inactiveUserSavings = calculateInactiveUserSavings(users, licensePrice);
  const integrationUserSavings = calculateIntegrationUserSavings(users, oauthTokens, licensePrice);
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
      details: `${inactiveUserSavings.count} users inactive for >30 days`
    },
    {
      title: "Integration User Optimization",
      amount: integrationUserSavings.savings,
      details: `${integrationUserSavings.count} users could be converted to integration users`
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

  const handlePriceChange = async (newPrice: number) => {
    try {
      const { data: settings, error: selectError } = await supabase
        .from('organization_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (selectError) throw selectError;

      if (settings) {
        const { error: updateError } = await supabase
          .from('organization_settings')
          .update({ license_cost_per_user: newPrice })
          .eq('id', settings.id);

        if (updateError) throw updateError;
        
        setLicensePrice(newPrice);
        toast({
          title: "Success",
          description: "License cost updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating license cost:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update license cost"
      });
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* License Cost Configuration */}
      <Card className="p-4">
        <div className="space-y-2">
          <Label htmlFor="licensePrice">License Cost per User (USD/month)</Label>
          <div className="flex gap-2">
            <Input
              id="licensePrice"
              type="number"
              value={licensePrice}
              onChange={(e) => handlePriceChange(parseFloat(e.target.value))}
              className="max-w-[200px]"
            />
          </div>
        </div>
      </Card>

      {/* Savings Summary */}
      <SavingsSummaryCard 
        totalSavings={totalSavings}
        breakdownItems={savingsBreakdown}
      />

      {/* Quick Wins Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recommendations
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savingsBreakdown
            .filter(item => item.amount > 0)
            .map((item, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-2xl font-bold text-sf-blue">
                      ${item.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">{item.details}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <AlertCircle className="h-4 w-4" />
                      2-3 weeks to implement
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};
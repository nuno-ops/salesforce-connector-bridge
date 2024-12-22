import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrgSettings = async () => {
      try {
        // Fetch organization settings from Supabase
        const { data: settings, error } = await supabase
          .from('organization_settings')
          .select('*')
          .single();

        if (error) throw error;

        if (settings) {
          setLicensePrice(settings.license_cost_per_user);
        }

        // Fetch organization type from Salesforce
        const token = localStorage.getItem('sf_access_token');
        if (!token) return;

        const { error: fnError } = await supabase.functions.invoke('salesforce-org', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (fnError) throw fnError;
      } catch (error) {
        console.error('Error fetching organization settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch organization settings"
        });
      }
    };

    fetchOrgSettings();
  }, [toast]);

  const handlePriceChange = async (newPrice: number) => {
    try {
      const { data: settings } = await supabase
        .from('organization_settings')
        .select('*')
        .single();

      if (settings) {
        const { error } = await supabase
          .from('organization_settings')
          .update({ license_cost_per_user: newPrice })
          .eq('id', settings.id);

        if (error) throw error;
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

  // Calculate potential savings based on the current license price
  const calculateLicenseSavings = () => {
    let totalUnused = 0;
    userLicenses.forEach(license => {
      const unused = license.total - license.used;
      if (unused > 0) totalUnused += unused;
    });
    return totalUnused * licensePrice * 12; // Annual savings
  };

  const calculateSandboxSavings = () => {
    const fullSandboxes = sandboxes.filter(sb => 
      sb.LicenseType.toLowerCase().includes('full')
    ).length;
    const excessFullSandboxes = Math.max(0, fullSandboxes - 1);
    return excessFullSandboxes * 5000 * 12;
  };

  const calculateStorageSavings = () => {
    if (storageUsage > 75) {
      const estimatedGBSavings = 2;
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
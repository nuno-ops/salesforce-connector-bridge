import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LicenseCostInputProps {
  licensePrice: number;
  onPriceChange: (newPrice: number) => void;
}

export const LicenseCostInput = ({ licensePrice, onPriceChange }: LicenseCostInputProps) => {
  const { toast } = useToast();

  const normalizeOrgId = (url: string) => {
    return url.replace(/[^a-zA-Z0-9]/g, '_');
  };

  useEffect(() => {
    const fetchContractPrice = async () => {
      try {
        const instanceUrl = localStorage.getItem('sf_instance_url');
        if (!instanceUrl) {
          console.error('No organization ID found');
          return;
        }

        const orgId = normalizeOrgId(instanceUrl);
        console.log('Fetching license cost for org:', orgId);
        
        const { data: settings, error } = await supabase
          .from('organization_settings')
          .select('license_cost_per_user')
          .eq('org_id', orgId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching license cost:', error);
          throw error;
        }

        if (settings?.license_cost_per_user) {
          const cost = parseFloat(settings.license_cost_per_user.toString());
          console.log('Found license cost in settings:', cost);
          onPriceChange(cost);
        } else {
          console.log('No license cost found in settings');
        }
      } catch (error) {
        console.error('Error fetching contract price:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch license cost"
        });
      }
    };

    fetchContractPrice();
  }, [onPriceChange, toast]);

  const handlePriceChange = async (value: string) => {
    try {
      const newPrice = value === '' ? 0 : parseFloat(value);
      if (isNaN(newPrice)) {
        throw new Error('Invalid price value');
      }

      const instanceUrl = localStorage.getItem('sf_instance_url');
      if (!instanceUrl) {
        throw new Error('Organization ID not found');
      }

      const orgId = normalizeOrgId(instanceUrl);
      console.log('Updating license cost to:', newPrice);
      
      const { error: updateError } = await supabase
        .from('organization_settings')
        .update({ 
          license_cost_per_user: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('org_id', orgId);

      if (updateError) throw updateError;
      
      onPriceChange(newPrice);
      toast({
        title: "Success",
        description: `License cost updated to $${newPrice}`
      });
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
    <Card className="p-4">
      <div className="space-y-2">
        <Label htmlFor="licensePrice">License Cost per User (USD/month)</Label>
        <div className="flex gap-2">
          <Input
            id="licensePrice"
            type="number"
            value={licensePrice || ''}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="max-w-[200px]"
            placeholder="Enter license cost"
          />
        </div>
      </div>
    </Card>
  );
};
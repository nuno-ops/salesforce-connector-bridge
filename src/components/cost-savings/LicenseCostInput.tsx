import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ServiceItem {
  name: string;
  startDate: string;
  endDate: string;
  term: number;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface LicenseCostInputProps {
  licensePrice: number;
  onPriceChange: (newPrice: number) => void;
}

export const LicenseCostInput = ({ licensePrice, onPriceChange }: LicenseCostInputProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const fetchContractPrice = async () => {
      try {
        const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
        if (!orgId) return;

        const { data: settings, error } = await supabase
          .from('organization_settings')
          .select('license_cost_per_user')
          .eq('org_id', orgId)
          .maybeSingle();

        if (error) throw error;

        if (settings?.license_cost_per_user) {
          console.log('Fetched license cost:', settings.license_cost_per_user);
          onPriceChange(parseFloat(settings.license_cost_per_user.toString()));
        }
      } catch (error) {
        console.error('Error fetching contract price:', error);
      }
    };

    fetchContractPrice();
  }, [onPriceChange]);

  const handlePriceChange = async (value: string) => {
    try {
      const newPrice = value === '' ? 0 : parseFloat(value);
      const orgId = localStorage.getItem('sf_instance_url')?.replace(/[^a-zA-Z0-9]/g, '_');
      
      if (!orgId) {
        throw new Error('Organization ID not found');
      }

      const { data: settings, error: selectError } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('org_id', orgId)
        .maybeSingle();

      if (selectError) throw selectError;

      if (settings) {
        const { error: updateError } = await supabase
          .from('organization_settings')
          .update({ 
            license_cost_per_user: newPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);

        if (updateError) throw updateError;
        
        console.log('Updated license cost to:', newPrice);
        onPriceChange(newPrice);
        toast({
          title: "Success",
          description: `License cost updated to $${newPrice}`
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
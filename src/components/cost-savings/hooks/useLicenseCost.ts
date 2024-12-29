import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { normalizeOrgId } from "@/utils/orgIdUtils";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface OrganizationSettings {
  org_id: string;
  license_cost_per_user: number;
  org_type: string;
  updated_at: string;
}

export const useLicenseCost = (
  licensePrice: number,
  onPriceChange: (newPrice: number) => void
) => {
  const { toast } = useToast();

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
          if (cost !== licensePrice) {
            console.log('Found different license cost in settings:', cost);
            onPriceChange(cost);
          }
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

    // Set up real-time subscription for license price updates
    const instance_url = localStorage.getItem('sf_instance_url');
    if (instance_url) {
      const orgId = normalizeOrgId(instance_url);
      
      const subscription = supabase
        .channel('organization_settings_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'organization_settings',
            filter: `org_id=eq.${orgId}`
          },
          async (payload: RealtimePostgresChangesPayload<OrganizationSettings>) => {
            console.log('Received real-time update:', payload);
            if (payload.new && 'license_cost_per_user' in payload.new) {
              const newCost = payload.new.license_cost_per_user;
              if (typeof newCost === 'number' && newCost !== licensePrice) {
                onPriceChange(newCost);
              }
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [onPriceChange, toast]); // Remove licensePrice from dependencies
};
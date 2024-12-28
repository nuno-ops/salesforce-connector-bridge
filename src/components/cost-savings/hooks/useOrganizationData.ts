import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useOrganizationData = () => {
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

        // Fetch license price from settings
        const orgId = instance_url.replace(/[^a-zA-Z0-9]/g, '_');
        console.log('Fetching license price for org:', orgId);
        
        const { data: settings, error: settingsError } = await supabase
          .from('organization_settings')
          .select('license_cost_per_user')
          .eq('org_id', orgId)
          .maybeSingle();

        if (settingsError) throw settingsError;

        if (settings?.license_cost_per_user) {
          const cost = parseFloat(settings.license_cost_per_user.toString());
          console.log('Setting license price to:', cost);
          setLicensePrice(cost);
        } else {
          console.log('No license cost found in settings');
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

  const updateLicensePrice = async (newPrice: number) => {
    try {
      const instance_url = localStorage.getItem('sf_instance_url');
      if (!instance_url) {
        throw new Error('Missing instance URL');
      }

      const orgId = instance_url.replace(/[^a-zA-Z0-9]/g, '_');
      
      const { error } = await supabase
        .from('organization_settings')
        .upsert({
          org_id: orgId,
          license_cost_per_user: newPrice,
          org_type: 'salesforce',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'org_id'
        });

      if (error) throw error;

      setLicensePrice(newPrice);
      console.log('License price updated successfully to:', newPrice);
      
      toast({
        title: "Success",
        description: "License cost updated successfully"
      });
    } catch (error) {
      console.error('Error updating license price:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update license cost"
      });
    }
  };

  return {
    licensePrice,
    setLicensePrice: updateLicensePrice,
    users,
    oauthTokens
  };
};
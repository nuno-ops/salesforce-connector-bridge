import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useOrganizationData = () => {
  const [licensePrice, setLicensePrice] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);
  const [oauthTokens, setOauthTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLicensePrice = async (orgId: string) => {
    console.log('Fetching license price for org:', orgId);
    
    const { data: settings, error: settingsError } = await supabase
      .from('organization_settings')
      .select('license_cost_per_user')
      .eq('org_id', orgId)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching license price:', settingsError);
      return;
    }

    if (settings?.license_cost_per_user) {
      const cost = parseFloat(settings.license_cost_per_user.toString());
      console.log('Found license price in settings:', cost);
      setLicensePrice(cost);
    } else {
      console.log('No license cost found in settings');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('Starting data fetch in useOrganizationData...');
        
        const access_token = localStorage.getItem('sf_access_token');
        const instance_url = localStorage.getItem('sf_instance_url');
        const timestamp = localStorage.getItem('sf_token_timestamp');

        console.log('Credentials check:', {
          hasAccessToken: !!access_token,
          hasInstanceUrl: !!instance_url,
          hasTimestamp: !!timestamp,
          timestamp: new Date().toISOString()
        });

        if (!access_token || !instance_url || !timestamp) {
          console.log('Missing Salesforce credentials');
          return;
        }

        // Fetch users and OAuth tokens
        console.log('Invoking salesforce-users function...');
        const { data, error } = await supabase.functions.invoke('salesforce-users', {
          body: { access_token, instance_url }
        });

        if (error) {
          console.error('Error from salesforce-users function:', error);
          throw error;
        }

        console.log('Raw response from salesforce-users:', data);

        if (!data?.users || !Array.isArray(data.users)) {
          console.error('Invalid users data structure:', data?.users);
          throw new Error('Invalid users data received');
        }

        if (!data?.oauthTokens || !Array.isArray(data.oauthTokens)) {
          console.error('Invalid oauthTokens data structure:', data?.oauthTokens);
          throw new Error('Invalid oauthTokens data received');
        }

        console.log('Setting users state:', {
          count: data.users.length,
          firstUser: data.users[0],
          timestamp: new Date().toISOString()
        });
        setUsers(data.users);

        console.log('Setting oauthTokens state:', {
          count: data.oauthTokens.length,
          firstToken: data.oauthTokens[0],
          timestamp: new Date().toISOString()
        });
        setOauthTokens(data.oauthTokens);

        console.log('State updates completed:', {
          usersLength: data.users.length,
          oauthTokensLength: data.oauthTokens.length,
          timestamp: new Date().toISOString()
        });

        // Fetch license price
        const orgId = instance_url.replace(/[^a-zA-Z0-9]/g, '_');
        await fetchLicensePrice(orgId);

      } catch (error) {
        console.error('Error in fetchData:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch organization data"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription for license price updates
    const instance_url = localStorage.getItem('sf_instance_url');
    if (instance_url) {
      const orgId = instance_url.replace(/[^a-zA-Z0-9]/g, '_');
      console.log('Setting up realtime subscription for org:', orgId);
      
      const channel = supabase
        .channel(`organization_settings_${orgId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'organization_settings',
            filter: `org_id=eq.${orgId}`
          },
          async (payload) => {
            console.log('Received real-time update:', payload);
            await fetchLicensePrice(orgId);
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      return () => {
        console.log('Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      };
    }
  }, [toast]);

  const updateLicensePrice = async (newPrice: number) => {
    try {
      const instance_url = localStorage.getItem('sf_instance_url');
      if (!instance_url) {
        throw new Error('Missing instance URL');
      }

      const orgId = instance_url.replace(/[^a-zA-Z0-9]/g, '_');
      console.log('Updating license price for org:', orgId, 'to:', newPrice);
      
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
    oauthTokens,
    isLoading
  };
};
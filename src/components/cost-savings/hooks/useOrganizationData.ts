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

  return {
    licensePrice,
    setLicensePrice,
    users,
    oauthTokens
  };
};
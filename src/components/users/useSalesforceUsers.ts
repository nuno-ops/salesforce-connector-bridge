
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationData } from '../cost-savings/hooks/useOrganizationData';
import { useSavingsCalculations } from '../cost-savings/SavingsCalculator';

interface SalesforceUser {
  Id: string;
  Username: string;
  LastLoginDate: string;
  UserType: string;
  Profile: {
    Name: string;
    UserLicense?: {
      LicenseDefinitionKey?: string;
    };
  };
}

interface OAuthToken {
  Id: string;
  AppName: string;
  LastUsedDate: string;
  UseCount: number;
  UserId: string;
}

export const useSalesforceUsers = () => {
  const [users, setUsers] = useState<SalesforceUser[]>([]);
  const [oauthTokens, setOauthTokens] = useState<OAuthToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instanceUrl, setInstanceUrl] = useState('');
  const { toast } = useToast();
  const { licensePrice } = useOrganizationData();

  useEffect(() => {
    const fetchUsers = async () => {
      const access_token = localStorage.getItem('sf_access_token');
      const instance_url = localStorage.getItem('sf_instance_url');

      if (!access_token || !instance_url) {
        toast({
          variant: "destructive",
          title: "Not connected",
          description: "Please connect to Salesforce first.",
        });
        setIsLoading(false);
        setError("Not connected");
        return;
      }

      setInstanceUrl(instance_url);

      try {
        const { data, error } = await supabase.functions.invoke('salesforce-users', {
          body: { access_token, instance_url }
        });

        if (error) throw error;

        // Check if the response indicates a session error
        if (data?.error?.includes('Session expired or invalid') || data?.error?.includes('INVALID_SESSION_ID')) {
          console.log('Salesforce session expired, clearing local storage');
          localStorage.removeItem('sf_access_token');
          localStorage.removeItem('sf_instance_url');
          localStorage.removeItem('sf_token_timestamp');
          localStorage.removeItem('sf_subscription_status');
          
          toast({
            variant: "destructive",
            title: "Session expired",
            description: "Your Salesforce session has expired. Please reconnect.",
          });
          
          window.location.reload();
          return;
        }

        setUsers(data.users);
        setOauthTokens(data.oauthTokens);

        // Calculate savings using the same logic as the dashboard
        const { inactiveUsers, integrationUsers } = useSavingsCalculations({
          users: data.users,
          oauthTokens: data.oauthTokens,
          licensePrice,
          sandboxes: [],  // Not needed for user calculations
          storageUsage: 0,  // Not needed for user calculations
          userLicenses: []  // This will be handled within the calculations
        });

        if (inactiveUsers?.length > 0 || integrationUsers?.length > 0) {
          toast({
            title: "License Optimization Opportunities Found",
            description: `Found ${inactiveUsers?.length || 0} inactive users and ${integrationUsers?.length || 0} potential integration user conversions.`,
          });
        }

      } catch (error: any) {
        console.error('Error fetching users:', error);
        
        if (error.message?.includes('Session expired') || error.message?.includes('INVALID_SESSION_ID')) {
          console.log('Salesforce session expired, clearing local storage');
          localStorage.removeItem('sf_access_token');
          localStorage.removeItem('sf_instance_url');
          localStorage.removeItem('sf_token_timestamp');
          localStorage.removeItem('sf_subscription_status');
          
          toast({
            variant: "destructive",
            title: "Session expired",
            description: "Your Salesforce session has expired. Please reconnect.",
          });
          
          window.location.reload();
          return;
        }
        
        toast({
          variant: "destructive",
          title: "Error loading users",
          description: "Failed to load Salesforce users. Please try reconnecting.",
        });
        setError("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast, licensePrice]);

  return {
    users,
    oauthTokens,
    isLoading,
    error,
    instanceUrl
  };
};

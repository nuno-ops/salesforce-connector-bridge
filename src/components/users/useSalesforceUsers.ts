import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateInactiveUsers, 
  analyzeIntegrationOpportunities 
} from '../cost-savings/utils/licenseCalculations';

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
          
          // Force page reload to return to landing page
          window.location.reload();
          return;
        }

        const inactiveUsers = calculateInactiveUsers(data.users);
        const potentialIntegrationUsers = analyzeIntegrationOpportunities(
          data.users,
          data.oauthTokens,
          inactiveUsers
        );

        setUsers(data.users);
        setOauthTokens(data.oauthTokens);

        if (inactiveUsers.length > 0 || potentialIntegrationUsers.length > 0) {
          toast({
            title: "License Optimization Opportunities Found",
            description: `Found ${inactiveUsers.length} inactive users and ${potentialIntegrationUsers.length} potential integration user conversions.`,
          });
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        
        // Check if the error is related to session expiration
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
          
          // Force page reload to return to landing page
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
  }, [toast]);

  return {
    users,
    oauthTokens,
    isLoading,
    error,
    instanceUrl
  };
};
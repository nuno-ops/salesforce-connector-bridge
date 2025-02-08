
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationData } from '../cost-savings/hooks/useOrganizationData';
import { calculateSavings } from '../cost-savings/utils/savingsCalculations';
import { filterStandardSalesforceUsers } from './utils/userFilters';

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

interface IntegrationUsers {
  count: number;
}

export const useSalesforceUsers = () => {
  const [users, setUsers] = useState<SalesforceUser[]>([]);
  const [oauthTokens, setOAuthTokens] = useState<OAuthToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instanceUrl, setInstanceUrl] = useState('');
  const { toast } = useToast();
  const { licensePrice } = useOrganizationData();

  // Filter standard users once when the users array changes
  const standardUsers = useMemo(() => {
    console.log('[useSalesforceUsers] Filtering standard users from:', {
      totalUsers: users.length,
      timestamp: new Date().toISOString()
    });
    return filterStandardSalesforceUsers(users);
  }, [users]);

  // Calculate savings using memoization to avoid recalculation on every render
  const { inactiveUsers, integrationUsers } = useMemo(() => {
    console.log('[useMemo] Starting calculation with:', {
      standardUsersCount: standardUsers.length,
      oauthTokensCount: oauthTokens.length,
      licensePrice,
      timestamp: new Date().toISOString()
    });
    
    if (!standardUsers.length) {
      console.log('[useMemo] No users available for calculation');
      return { 
        inactiveUsers: [], 
        integrationUsers: { count: 0 } as IntegrationUsers 
      };
    }
    
    const result = calculateSavings({
      users: standardUsers,  // Use filtered standard users
      oauthTokens,
      licensePrice,
      sandboxes: [],
      storageUsage: 0,
      userLicenses: []
    });

    console.log('[useMemo] Raw calculation results:', result);

    // First convert result.integrationUsers to IntegrationUsers type
    const integrationUsersResult: IntegrationUsers = typeof result.integrationUsers === 'number' 
      ? { count: result.integrationUsers } 
      : result.integrationUsers as IntegrationUsers;

    console.log('[useMemo] Processed calculation results:', {
      inactiveUsersCount: result.inactiveUsers?.length,
      integrationUsersCount: integrationUsersResult.count,
      timestamp: new Date().toISOString()
    });

    return {
      inactiveUsers: result.inactiveUsers,
      integrationUsers: integrationUsersResult
    };
  }, [standardUsers, oauthTokens, licensePrice]);

  // Separate useEffect for showing the toast notification
  useEffect(() => {
    console.log('[Toast Effect] Triggered with:', {
      inactiveUsers: Array.isArray(inactiveUsers) ? inactiveUsers.length : 'not an array',
      integrationUsersCount: integrationUsers?.count,
      timestamp: new Date().toISOString()
    });

    if ((Array.isArray(inactiveUsers) && inactiveUsers.length > 0) || 
        (integrationUsers?.count > 0)) {
      console.log('[Toast Effect] Showing toast with:', {
        inactiveCount: Array.isArray(inactiveUsers) ? inactiveUsers.length : 0,
        integrationCount: integrationUsers?.count || 0,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "License Optimization Opportunities Found",
        description: `Found ${Array.isArray(inactiveUsers) ? inactiveUsers.length : 0} inactive users and ${integrationUsers?.count || 0} potential integration user conversions.`,
      });
    }
  }, [inactiveUsers, integrationUsers, toast]);

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
        console.log('[fetchUsers] Starting Salesforce data fetch...');
        const { data, error } = await supabase.functions.invoke('salesforce-users', {
          body: { access_token, instance_url }
        });

        if (error) throw error;

        if (data?.error?.includes('Session expired') || data?.error?.includes('INVALID_SESSION_ID')) {
          console.log('[fetchUsers] Salesforce session expired, clearing local storage');
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

        console.log('[fetchUsers] Received data from Salesforce:', {
          usersCount: data.users?.length,
          oauthTokensCount: data.oauthTokens?.length,
          timestamp: new Date().toISOString()
        });

        setUsers(data.users);
        setOAuthTokens(data.oauthTokens);

      } catch (error: any) {
        console.error('[fetchUsers] Error:', error);
        
        if (error.message?.includes('Session expired') || error.message?.includes('INVALID_SESSION_ID')) {
          console.log('[fetchUsers] Session expired, clearing local storage');
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
    users: standardUsers, // Return filtered users instead of all users
    oauthTokens,
    isLoading,
    error,
    instanceUrl
  };
};

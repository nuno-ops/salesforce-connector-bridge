import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrgLimits, SandboxInfo, RawUserLicense, RawPackageLicense, RawPermissionSetLicense, MonthlyMetrics } from './types';

export const useOrgHealthData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-health'],
    queryFn: async () => {
      const access_token = localStorage.getItem('sf_access_token');
      const instance_url = localStorage.getItem('sf_instance_url');

      console.log('useOrgHealthData - Starting data fetch with credentials:', {
        hasAccessToken: !!access_token,
        hasInstanceUrl: !!instance_url,
        timestamp: new Date().toISOString()
      });

      if (!access_token || !instance_url) {
        throw new Error('Missing Salesforce credentials');
      }

      try {
        // Fetch licenses data
        console.log('useOrgHealthData - Fetching licenses data...');
        const licensesResponse = await supabase.functions.invoke('salesforce-licenses', {
          body: { access_token, instance_url }
        });

        console.log('useOrgHealthData - Raw licenses response:', licensesResponse.data);

        if (licensesResponse.error) {
          if (licensesResponse.error.message?.includes('INVALID_SESSION_ID') ||
              licensesResponse.error.message?.includes('Session expired')) {
            throw new Error('Session expired or invalid');
          }
          throw licensesResponse.error;
        }

        // Fetch limits data
        console.log('useOrgHealthData - Fetching limits data...');
        const limitsResponse = await supabase.functions.invoke('salesforce-limits', {
          body: { access_token, instance_url }
        });

        console.log('useOrgHealthData - Raw limits response:', limitsResponse.data);

        if (limitsResponse.error) {
          if (limitsResponse.error.message?.includes('INVALID_SESSION_ID') ||
              limitsResponse.error.message?.includes('Session expired')) {
            throw new Error('Session expired or invalid');
          }
          throw limitsResponse.error;
        }

        // Fetch sandboxes data
        console.log('useOrgHealthData - Fetching sandboxes data...');
        const sandboxesResponse = await supabase.functions.invoke('salesforce-sandboxes', {
          body: { access_token, instance_url }
        });

        console.log('useOrgHealthData - Raw sandboxes response:', sandboxesResponse.data);

        if (sandboxesResponse.error) {
          if (sandboxesResponse.error.message?.includes('INVALID_SESSION_ID') ||
              sandboxesResponse.error.message?.includes('Session expired')) {
            throw new Error('Session expired or invalid');
          }
          throw sandboxesResponse.error;
        }

        // Fetch metrics data
        console.log('useOrgHealthData - Fetching metrics data...');
        const metricsResponse = await supabase.functions.invoke('salesforce-metrics', {
          body: { access_token, instance_url }
        });

        console.log('useOrgHealthData - Raw metrics response:', metricsResponse.data);

        if (metricsResponse.error) {
          if (metricsResponse.error.message?.includes('INVALID_SESSION_ID') ||
              metricsResponse.error.message?.includes('Session expired')) {
            throw new Error('Session expired or invalid');
          }
          throw metricsResponse.error;
        }

        // Fetch users data
        console.log('useOrgHealthData - Fetching users data...');
        const usersResponse = await supabase.functions.invoke('salesforce-users', {
          body: { access_token, instance_url }
        });

        console.log('useOrgHealthData - Raw users response:', usersResponse.data);

        if (usersResponse.error) {
          if (usersResponse.error.message?.includes('INVALID_SESSION_ID') ||
              usersResponse.error.message?.includes('Session expired')) {
            throw new Error('Session expired or invalid');
          }
          throw usersResponse.error;
        }

        // Default limits structure
        const defaultLimits: OrgLimits = {
          DataStorageMB: { Max: 0, Remaining: 0 },
          FileStorageMB: { Max: 0, Remaining: 0 },
          DailyApiRequests: { Max: 0, Remaining: 0 },
          SingleEmail: { Max: 0, Remaining: 0 },
          HourlyTimeBasedWorkflow: { Max: 0, Remaining: 0 }
        };

        const finalData = {
          userLicenses: licensesResponse.data?.userLicenses || [],
          packageLicenses: licensesResponse.data?.packageLicenses || [],
          permissionSetLicenses: licensesResponse.data?.permissionSetLicenses || [],
          sandboxes: sandboxesResponse.data?.records || [],
          limits: { ...defaultLimits, ...limitsResponse.data },
          metrics: metricsResponse.data || null,
          users: usersResponse.data?.users || [],
          oauthTokens: usersResponse.data?.oauthTokens || [],
        };

        console.log('useOrgHealthData - Final data structure details:', {
          userLicensesCount: finalData.userLicenses.length,
          packageLicensesCount: finalData.packageLicenses.length,
          permissionSetLicensesCount: finalData.permissionSetLicenses.length,
          sandboxesCount: finalData.sandboxes.length,
          hasLimits: !!finalData.limits,
          hasMetrics: !!finalData.metrics,
          usersCount: finalData.users.length,
          oauthTokensCount: finalData.oauthTokens.length,
          firstUser: finalData.users[0],
          firstOAuthToken: finalData.oauthTokens[0],
          timestamp: new Date().toISOString()
        });

        return finalData;
      } catch (error) {
        console.error('Error in useOrgHealthData:', error);
        throw error;
      }
    }
  });

  console.log('useOrgHealthData - Hook return value:', {
    hasData: !!data,
    isLoading,
    hasError: !!error,
    userCount: data?.users?.length,
    oauthTokenCount: data?.oauthTokens?.length,
    firstUser: data?.users?.[0],
    firstOAuthToken: data?.oauthTokens?.[0]
  });

  return {
    userLicenses: data?.userLicenses || [],
    packageLicenses: data?.packageLicenses || [],
    permissionSetLicenses: data?.permissionSetLicenses || [],
    sandboxes: data?.sandboxes || [],
    limits: data?.limits || {
      DataStorageMB: { Max: 0, Remaining: 0 },
      FileStorageMB: { Max: 0, Remaining: 0 },
      DailyApiRequests: { Max: 0, Remaining: 0 },
      SingleEmail: { Max: 0, Remaining: 0 },
      HourlyTimeBasedWorkflow: { Max: 0, Remaining: 0 }
    },
    users: data?.users || [],
    oauthTokens: data?.oauthTokens || [],
    metrics: data?.metrics || null,
    isLoading,
    error: error ? (error as Error) : null
  };
};
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrgLimits, SandboxInfo, RawUserLicense, RawPackageLicense, RawPermissionSetLicense, MonthlyMetrics } from './types';

export const useOrgHealthData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-health'],
    queryFn: async () => {
      const access_token = localStorage.getItem('sf_access_token');
      const instance_url = localStorage.getItem('sf_instance_url');

      if (!access_token || !instance_url) {
        throw new Error('Missing Salesforce credentials');
      }

      try {
        // Fetch licenses data
        const licensesResponse = await supabase.functions.invoke('salesforce-licenses', {
          body: { access_token, instance_url }
        });

        if (licensesResponse.error) {
          // Check if the error is due to session expiration
          if (licensesResponse.error.message?.includes('INVALID_SESSION_ID') ||
              licensesResponse.error.message?.includes('Session expired')) {
            throw new Error('Session expired or invalid');
          }
          throw licensesResponse.error;
        }

        // Fetch limits data
        const limitsResponse = await supabase.functions.invoke('salesforce-limits', {
          body: { access_token, instance_url }
        });

        if (limitsResponse.error) {
          if (limitsResponse.error.message?.includes('INVALID_SESSION_ID') ||
              limitsResponse.error.message?.includes('Session expired')) {
            throw new Error('Session expired or invalid');
          }
          throw limitsResponse.error;
        }

        // Fetch sandboxes data
        const sandboxesResponse = await supabase.functions.invoke('salesforce-sandboxes', {
          body: { access_token, instance_url }
        });

        if (sandboxesResponse.error) {
          if (sandboxesResponse.error.message?.includes('INVALID_SESSION_ID') ||
              sandboxesResponse.error.message?.includes('Session expired')) {
            throw new Error('Session expired or invalid');
          }
          throw sandboxesResponse.error;
        }

        // Fetch metrics data
        const metricsResponse = await supabase.functions.invoke('salesforce-metrics', {
          body: { access_token, instance_url }
        });

        if (metricsResponse.error) {
          if (metricsResponse.error.message?.includes('INVALID_SESSION_ID') ||
              metricsResponse.error.message?.includes('Session expired')) {
            throw new Error('Session expired or invalid');
          }
          throw metricsResponse.error;
        }

        console.log('API Responses:', {
          licenses: licensesResponse.data,
          limits: limitsResponse.data,
          sandboxes: sandboxesResponse.data,
          metrics: metricsResponse.data
        });

        // Default limits structure that matches OrgLimits type
        const defaultLimits: OrgLimits = {
          DataStorageMB: { Max: 0, Remaining: 0 },
          FileStorageMB: { Max: 0, Remaining: 0 },
          DailyApiRequests: { Max: 0, Remaining: 0 },
          SingleEmail: { Max: 0, Remaining: 0 },
          HourlyTimeBasedWorkflow: { Max: 0, Remaining: 0 }
        };

        return {
          userLicenses: licensesResponse.data?.userLicenses || [],
          packageLicenses: licensesResponse.data?.packageLicenses || [],
          permissionSetLicenses: licensesResponse.data?.permissionSetLicenses || [],
          sandboxes: sandboxesResponse.data?.records || [],
          limits: { ...defaultLimits, ...limitsResponse.data },
          metrics: metricsResponse.data || null,
          users: [],  // Maintained for backward compatibility
          oauthTokens: [], // Maintained for backward compatibility
        };
      } catch (error) {
        console.error('Error in useOrgHealthData:', error);
        throw error;
      }
    }
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
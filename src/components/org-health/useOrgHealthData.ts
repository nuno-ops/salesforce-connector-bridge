import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrgLimits, SandboxInfo, UserLicense, PackageLicense, PermissionSetLicense, MonthlyMetrics } from './types';

export const useOrgHealthData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-health'],
    queryFn: async () => {
      const access_token = localStorage.getItem('sf_access_token');
      const instance_url = localStorage.getItem('sf_instance_url');

      if (!access_token || !instance_url) {
        throw new Error('Missing Salesforce credentials');
      }

      const { data, error } = await supabase.functions.invoke('salesforce-licenses', {
        body: { access_token, instance_url }
      });

      if (error) throw error;

      console.log('useOrgHealthData raw response:', {
        userLicenses: data.userLicenses,
        packageLicenses: data.packageLicenses,
        permissionSetLicenses: data.permissionSetLicenses,
        isUserLicensesArray: Array.isArray(data.userLicenses),
        isPackageLicensesArray: Array.isArray(data.packageLicenses),
        isPermissionSetLicensesArray: Array.isArray(data.permissionSetLicenses)
      });

      return data;
    }
  });

  return {
    userLicenses: data?.userLicenses || [],
    packageLicenses: data?.packageLicenses || [],
    permissionSetLicenses: data?.permissionSetLicenses || [],
    isLoading,
    error: error ? (error as Error).message : null
  };
};
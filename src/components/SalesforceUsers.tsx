import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InactiveUsersSection } from './users/InactiveUsersSection';
import { 
  calculateInactiveUsers, 
  analyzeIntegrationOpportunities,
  calculateTotalSavings 
} from './cost-savings/utils/licenseCalculations';

interface SalesforceUser {
  Id: string;
  Username: string;
  LastLoginDate: string;
  UserType: string;
  Profile: {
    Name: string;
  };
}

interface OAuthToken {
  Id: string;
  AppName: string;
  LastUsedDate: string;
  UseCount: number;
  UserId: string;
}

export const SalesforceUsers = () => {
  const [users, setUsers] = useState<SalesforceUser[]>([]);
  const [oauthTokens, setOauthTokens] = useState<OAuthToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        return;
      }

      setInstanceUrl(instance_url);

      try {
        const { data, error } = await supabase.functions.invoke('salesforce-users', {
          body: { access_token, instance_url }
        });

        if (error) throw error;

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
        toast({
          variant: "destructive",
          title: "Error loading users",
          description: "Failed to load Salesforce users. Please try reconnecting.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <InactiveUsersSection 
        users={users} 
        instanceUrl={instanceUrl}
        oauthTokens={oauthTokens}
      />
    </div>
  );
};
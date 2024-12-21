import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OrgHealth } from './OrgHealth';
import { subDays } from 'date-fns';
import { InactiveUsersSection } from './users/InactiveUsersSection';

interface SalesforceUser {
  Id: string;
  Username: string;
  LastLoginDate: string;
}

export const SalesforceUsers = () => {
  const [users, setUsers] = useState<SalesforceUser[]>([]);
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

        // Filter users who haven't logged in for more than 30 days
        const thirtyDaysAgo = subDays(new Date(), 30);
        const inactiveUsers = data.records.filter(user => {
          if (!user.LastLoginDate) return true;
          return new Date(user.LastLoginDate) < thirtyDaysAgo;
        });

        setUsers(inactiveUsers);
        if (inactiveUsers.length > 0) {
          toast({
            title: "Inactive Users Found",
            description: `Found ${inactiveUsers.length} users who haven't logged in for over 30 days.`,
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
      <OrgHealth />
      <InactiveUsersSection users={users} instanceUrl={instanceUrl} />
    </div>
  );
};
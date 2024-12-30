import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformUser {
  Id: string;
  Username: string;
  LastLoginDate: string | null;
  UserType: string;
}

export const usePlatformUsers = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlatformUsers = async () => {
      try {
        const access_token = localStorage.getItem('sf_access_token');
        const instance_url = localStorage.getItem('sf_instance_url');

        if (!access_token || !instance_url) {
          throw new Error('Missing Salesforce credentials');
        }

        const { data, error } = await supabase.functions.invoke('salesforce-platform-users', {
          body: { access_token, instance_url }
        });

        if (error) throw error;

        setUsers(data.users || []);
      } catch (err) {
        console.error('Error fetching platform users:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch platform users'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformUsers();
  }, []);

  return { users, isLoading, error };
};
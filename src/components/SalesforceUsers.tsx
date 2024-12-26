import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InactiveUsersSection } from './users/InactiveUsersSection';
import { useSalesforceUsers } from './users/useSalesforceUsers';

export const SalesforceUsers = () => {
  const { users, oauthTokens, isLoading, instanceUrl, error } = useSalesforceUsers();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return null;
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
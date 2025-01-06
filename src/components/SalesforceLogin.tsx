import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { LoginForm } from './salesforce/LoginForm';
import { SetupInstructions } from './salesforce/SetupInstructions';
import { initiateOAuthFlow } from './salesforce/useSalesforceAuth';
import { ConnectHeader } from './salesforce/login/ConnectHeader';
import { CallbackUrlSection } from './salesforce/login/CallbackUrlSection';
import { RequiredScopesSection } from './salesforce/login/RequiredScopesSection';
import { ImportantSettingsSection } from './salesforce/login/ImportantSettingsSection';

interface SalesforceLoginProps {
  onSuccess?: () => void;
}

export const SalesforceLogin = ({ onSuccess }: SalesforceLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const CALLBACK_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5173/salesforce/callback'
    : `https://${window.location.hostname}/salesforce/callback`;

  useEffect(() => {
    const checkExistingConnection = () => {
      const token = localStorage.getItem('sf_access_token');
      const timestamp = localStorage.getItem('sf_token_timestamp');
      
      if (token && timestamp) {
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge < 7200000) {
          console.log('Found valid existing connection');
          onSuccess?.();
          return;
        }
      }
      resetOAuthState();
    };

    checkExistingConnection();
  }, [onSuccess]);

  const resetOAuthState = () => {
    localStorage.removeItem('sf_temp_client_id');
    localStorage.removeItem('sf_temp_client_secret');
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    localStorage.removeItem('sf_token_timestamp');
    setIsLoading(false);
  };

  const handleSubmit = async (credentials: {
    clientId: string;
    clientSecret: string;
  }) => {
    setIsLoading(true);

    try {
      localStorage.setItem('sf_temp_client_id', credentials.clientId);
      localStorage.setItem('sf_temp_client_secret', credentials.clientSecret);
      
      console.log('Stored credentials in localStorage:', {
        clientId: credentials.clientId,
        hasSecret: !!credentials.clientSecret
      });
      
      initiateOAuthFlow(credentials.clientId);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Salesforce.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sf-light to-white p-4">
      <Card className="w-full max-w-md p-8 animate-fadeIn space-y-8">
        <ConnectHeader />
        <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />
        
        <CallbackUrlSection callbackUrl={CALLBACK_URL} />
        <RequiredScopesSection />
        <ImportantSettingsSection />

        <SetupInstructions callbackUrl={CALLBACK_URL} />
      </Card>
    </div>
  );
};
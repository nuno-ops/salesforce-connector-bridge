import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { LoginForm } from './salesforce/LoginForm';
import { initiateOAuthFlow } from './salesforce/useSalesforceAuth';
import { Button } from '@/components/ui/button';

interface SalesforceLoginProps {
  onSuccess?: () => void;
}

export const SalesforceLogin = ({ onSuccess }: SalesforceLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Clear any existing OAuth state on component mount
  useEffect(() => {
    resetOAuthState();
  }, []);

  const resetOAuthState = () => {
    // Clear any stored OAuth-related data
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
      // Reset any existing OAuth state before starting new flow
      resetOAuthState();
      
      // Store client secret temporarily for the callback
      localStorage.setItem('sf_temp_client_secret', credentials.clientSecret);
      
      // Initiate OAuth flow
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
    <Card className="w-full max-w-md p-6 animate-fadeIn">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Connect to Salesforce</h1>
          <p className="text-sm text-sf-gray">
            Enter your Salesforce Connected App credentials
          </p>
        </div>

        <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />

        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={resetOAuthState}
            disabled={isLoading}
          >
            Reset Connection
          </Button>

          <p className="text-xs text-center text-sf-gray">
            Make sure you have created a Connected App in Salesforce and have the correct credentials
          </p>
        </div>
      </div>
    </Card>
  );
};
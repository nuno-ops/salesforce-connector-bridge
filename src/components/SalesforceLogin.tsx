import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { LoginForm } from './salesforce/LoginForm';
import { SetupInstructions } from './salesforce/SetupInstructions';
import { initiateOAuthFlow } from './salesforce/useSalesforceAuth';
import { Info, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface SalesforceLoginProps {
  onSuccess?: () => void;
}

export const SalesforceLogin = ({ onSuccess }: SalesforceLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { toast } = useToast();

  // Update the callback URL to use https without a trailing colon
  const CALLBACK_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5173/salesforce/callback'
    : `https://${window.location.hostname}/salesforce/callback`;

  useEffect(() => {
    const checkExistingConnection = () => {
      const token = localStorage.getItem('sf_access_token');
      const timestamp = localStorage.getItem('sf_token_timestamp');
      
      if (token && timestamp) {
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge < 7200000) { // Less than 2 hours old
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

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(CALLBACK_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
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
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Connect to Salesforce</h1>
          <p className="text-sm text-sf-gray">
            Enter your Salesforce Connected App credentials
          </p>
        </div>

        <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />

        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sf-blue">
            <Info className="h-5 w-5" />
            <span className="font-medium">Important: Callback URL</span>
          </div>
          <div className="flex items-center space-x-2 bg-white p-2 rounded-md w-full">
            <code className="flex-1 break-all px-2 py-1 text-sm">{CALLBACK_URL}</code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyCallbackUrl}
              className="shrink-0"
            >
              {copiedUrl ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-sm text-sf-gray">
            You'll need this URL when setting up your Connected App in Salesforce.
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-yellow-800">
            <Info className="h-5 w-5" />
            <span className="font-medium">Required OAuth Scopes:</span>
          </div>
          <ul className="list-none space-y-2">
            {[
              "Manage user data via APIs (api)",
              "Manage user data via Web browsers (web)",
              "Full access (full)",
              "Perform requests at any time (refresh_token, offline_access)"
            ].map((scope, index) => (
              <li key={index} className="flex items-center text-yellow-700">
                <Check className="h-4 w-4 mr-2 text-yellow-600" />
                {scope}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium">Important Setting to Disable:</span>
          </div>
          <p className="text-red-800">
            Make sure to uncheck "Require Proof Key for Code Exchange (PKCE) Extension for Supported Authorization Flows" in the Connected App settings.
          </p>
        </div>

        <SetupInstructions callbackUrl={CALLBACK_URL} />
      </Card>
    </div>
  );
};
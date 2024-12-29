import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { LoginForm } from './salesforce/LoginForm';
import { initiateOAuthFlow } from './salesforce/useSalesforceAuth';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SalesforceLoginProps {
  onSuccess?: () => void;
}

export const SalesforceLogin = ({ onSuccess }: SalesforceLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Check for existing valid connection on mount
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
      <Card className="w-full max-w-md p-6 animate-fadeIn">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Connect to Salesforce</h1>
            <p className="text-sm text-sf-gray">
              Enter your Salesforce Connected App credentials
            </p>
          </div>

          <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />

          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
            <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-sf-blue hover:text-sf-hover">
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Setup Instructions
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Need help setting up?
                </>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 text-sm bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-base">How to Create a Salesforce Connected App</h3>
              <ol className="list-decimal list-inside space-y-3 text-sf-gray">
                <li>Log in to your Salesforce account as an administrator</li>
                <li>Go to Setup (gear icon) → Apps → App Manager</li>
                <li>Click "New Connected App" in the top-right</li>
                <li>Fill in the basic information:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Connected App Name: "Cost Optimization App"</li>
                    <li>API Name: will auto-fill</li>
                    <li>Contact Email: your email</li>
                  </ul>
                </li>
                <li>Enable OAuth Settings:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Check "Enable OAuth Settings"</li>
                    <li>Callback URL: https://salesforce-connector-bridge.lovable.app/salesforce/callback</li>
                    <li>Selected OAuth Scopes: Add "Full access (full)"</li>
                  </ul>
                </li>
                <li>Click "Save" and wait for confirmation</li>
                <li>Copy the Consumer Key (Client ID) and Consumer Secret (Client Secret)</li>
                <li>Paste these credentials in the form above</li>
              </ol>
              <div className="mt-4 p-3 bg-blue-50 rounded text-sf-blue">
                <p className="font-medium">Note:</p>
                <p>It may take a few minutes for your Connected App to be ready after creation. If you get an error, please wait 5-10 minutes and try again.</p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={resetOAuthState}
              disabled={isLoading}
            >
              Reset Connection
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
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
import { ChevronDown, ChevronUp, Mail, Copy, Check, ChevronRight } from 'lucide-react';

interface SalesforceLoginProps {
  onSuccess?: () => void;
}

export const SalesforceLogin = ({ onSuccess }: SalesforceLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { toast } = useToast();

  const CALLBACK_URL = 'https://salesforce-connector-bridge.lovable.app/salesforce/callback';

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(CALLBACK_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    toast({
      description: "Callback URL copied to clipboard",
    });
  };

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
      <Card className="w-full max-w-md p-8 animate-fadeIn space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Connect to Salesforce</h1>
          <p className="text-sm text-sf-gray">
            Enter your Salesforce Connected App credentials
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-between text-sm text-sf-gray mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-sf-blue text-white flex items-center justify-center">
              1
            </div>
            <ChevronRight className="mx-2" />
            <div className="w-8 h-8 rounded-full border-2 border-sf-blue text-sf-blue flex items-center justify-center">
              2
            </div>
            <ChevronRight className="mx-2" />
            <div className="w-8 h-8 rounded-full border-2 border-sf-blue text-sf-blue flex items-center justify-center">
              3
            </div>
          </div>
        </div>

        <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />

        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-sf-blue hover:text-sf-hover transition-colors">
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
          <CollapsibleContent className="space-y-6 text-sm bg-gray-50 p-6 rounded-lg animate-fade-in">
            <h3 className="font-bold text-lg mb-4">How to Create a Salesforce Connected App</h3>
            <ol className="list-decimal list-inside space-y-4 text-sf-gray">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>Log in to your Salesforce account as an administrator</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>Go to Setup (gear icon) → Apps → App Manager</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>Click "New Connected App" in the top-right</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">4.</span>
                <div>
                  <p>Fill in the basic information:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                    <li>Connected App Name: "Cost Optimization App"</li>
                    <li>API Name: will auto-fill</li>
                    <li>Contact Email: your email</li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2">5.</span>
                <div>
                  <p>Enable OAuth Settings:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                    <li>Check "Enable OAuth Settings"</li>
                    <li className="flex items-center">
                      <span>Callback URL:</span>
                      <code className="mx-2 px-2 py-1 bg-white rounded">{CALLBACK_URL}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyCallbackUrl}
                        className="ml-2"
                      >
                        {copiedUrl ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </li>
                    <li>Selected OAuth Scopes: Add "Full access (full)"</li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2">6.</span>
                <span>Click "Save" and wait for confirmation</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">7.</span>
                <span>Copy the Consumer Key (Client ID) and Consumer Secret (Client Secret)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">8.</span>
                <span>Paste these credentials in the form above</span>
              </li>
            </ol>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sf-blue">
              <p className="font-medium">Note:</p>
              <p>It may take a few minutes for your Connected App to be ready after creation. If you get an error, please wait 5-10 minutes and try again.</p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-sf-blue border-t pt-4">
              <Mail className="h-4 w-4" />
              <a 
                href="mailto:support@salesforcesaver.com"
                className="hover:underline"
              >
                Need help? Contact our support team
              </a>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

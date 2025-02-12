import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { LoginForm } from './salesforce/LoginForm';
import { initiateOAuthFlow } from './salesforce/useSalesforceAuth';
import { ConnectHeader } from './salesforce/login/ConnectHeader';

interface SalesforceLoginProps {
  onSuccess?: () => void;
}

export const SalesforceLogin = ({ onSuccess }: SalesforceLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkExistingConnection = () => {
      const token = localStorage.getItem('sf_access_token');
      const timestamp = localStorage.getItem('sf_token_timestamp');
      
      if (token && timestamp) {
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge < 7200000) {
          console.log('Found valid existing connection');
          // Clear any cached subscription status to ensure proper access check
          localStorage.removeItem('sf_subscription_status');
          onSuccess?.();
          return;
        }
      }
      resetOAuthState();
    };

    checkExistingConnection();
  }, [onSuccess]);

  const resetOAuthState = () => {
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    localStorage.removeItem('sf_token_timestamp');
    localStorage.removeItem('sf_subscription_status');
    setIsLoading(false);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      initiateOAuthFlow();
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
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10 opacity-20" />
      
      <Card className="relative w-full max-w-md p-8 animate-fadeIn space-y-8 bg-black/40 border-white/10 backdrop-blur-sm">
        <ConnectHeader />
        <LoginForm onSubmit={handleConnect} isLoading={isLoading} />
      </Card>
    </div>
  );
};
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { LoginForm } from './salesforce/LoginForm';
import { authenticateSalesforce } from './salesforce/useSalesforceAuth';

interface SalesforceLoginProps {
  onSuccess?: () => void;
}

export const SalesforceLogin = ({ onSuccess }: SalesforceLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (credentials: {
    username: string;
    password: string;
    securityToken: string;
    clientId: string;
    clientSecret: string;
  }) => {
    setIsLoading(true);

    try {
      const authData = await authenticateSalesforce(credentials);
      
      // Store the access token, instance URL, and timestamp
      localStorage.setItem('sf_access_token', authData.access_token);
      localStorage.setItem('sf_instance_url', authData.instance_url);
      localStorage.setItem('sf_token_timestamp', Date.now().toString());
      
      toast({
        title: "Successfully connected!",
        description: "You are now connected to Salesforce.",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.response?.data?.error_description || error.message || "Invalid credentials or connection error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 animate-fadeIn">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Connect to Salesforce</h1>
          <p className="text-sm text-sf-gray">
            Enter your Salesforce credentials to get started
          </p>
        </div>

        <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />

        <p className="text-xs text-center text-sf-gray">
          Make sure you have created a Connected App in Salesforce and have the correct credentials
        </p>
      </div>
    </Card>
  );
};
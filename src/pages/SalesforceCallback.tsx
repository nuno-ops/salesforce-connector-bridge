import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleOAuthCallback } from "@/components/salesforce/useSalesforceAuth";

const SalesforceCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processOAuthCallback = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        console.error('No authorization code found in URL');
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: "No authorization code found. Please try again.",
        });
        navigate('/', { replace: true });
        return;
      }

      try {
        console.log('Processing OAuth callback with code:', code);
        const data = await handleOAuthCallback(code);
        
        if (!data?.access_token || !data?.instance_url) {
          throw new Error('Invalid response from Salesforce');
        }

        // Store the tokens
        localStorage.setItem('sf_access_token', data.access_token);
        localStorage.setItem('sf_instance_url', data.instance_url);
        localStorage.setItem('sf_token_timestamp', Date.now().toString());

        // Clear temporary storage
        localStorage.removeItem('sf_temp_client_id');
        localStorage.removeItem('sf_temp_client_secret');

        console.log('Successfully processed OAuth callback');
        toast({
          title: "Success",
          description: "You are now connected to Salesforce.",
        });

        // Redirect to dashboard instead of home page
        navigate('/dashboard', { replace: true });

      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: error instanceof Error ? error.message : "Failed to connect to Salesforce.",
        });
        navigate('/', { replace: true });
      }
    };

    processOAuthCallback();
  }, [navigate, searchParams, toast]);

  // Show loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-gray-600">Completing Salesforce connection...</p>
      </div>
    </div>
  );
};

export default SalesforceCallback;
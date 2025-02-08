
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
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: errorDescription || "Failed to connect to Salesforce.",
        });
        navigate('/', { replace: true });
        return;
      }

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
          throw { message: 'Invalid response from Salesforce' };
        }

        // Store all token information
        localStorage.setItem('sf_access_token', data.access_token);
        localStorage.setItem('sf_instance_url', data.instance_url);
        localStorage.setItem('sf_token_timestamp', Date.now().toString());
        localStorage.setItem('sf_token_expires_in', data.expires_in.toString());
        
        // Store refresh token if provided
        if (data.refresh_token) {
          localStorage.setItem('sf_refresh_token', data.refresh_token);
        }

        // Clear temporary storage
        localStorage.removeItem('sf_temp_client_id');
        localStorage.removeItem('sf_temp_client_secret');

        console.log('Successfully processed OAuth callback');
        toast({
          title: "Success",
          description: "You are now connected to Salesforce.",
        });

        navigate('/dashboard', { replace: true });

      } catch (error) {
        console.error('OAuth callback error:', error);
        let errorMessage = "Failed to connect to Salesforce.";
        
        if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = error.message;
        }

        toast({
          variant: "destructive",
          title: "Connection failed",
          description: errorMessage,
        });
        navigate('/', { replace: true });
      }
    };

    processOAuthCallback();
  }, [navigate, searchParams, toast]);

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

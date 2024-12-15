import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { handleOAuthCallback } from '@/components/salesforce/useSalesforceAuth';
import { Loader2 } from 'lucide-react';

const SalesforceCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          throw new Error(error);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        const authData = await handleOAuthCallback(code);
        
        // Store the access token and instance URL
        localStorage.setItem('sf_access_token', authData.access_token);
        localStorage.setItem('sf_instance_url', authData.instance_url);
        localStorage.setItem('sf_token_timestamp', Date.now().toString());

        toast({
          title: "Successfully connected!",
          description: "You are now connected to Salesforce.",
        });

        // Redirect back to the main page
        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: error.message || "Failed to complete Salesforce connection.",
        });
        navigate('/');
      } finally {
        setIsProcessing(false);
      }
    };

    processOAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {isProcessing && (
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-gray-600">Completing Salesforce connection...</p>
        </div>
      )}
    </div>
  );
};

export default SalesforceCallback;
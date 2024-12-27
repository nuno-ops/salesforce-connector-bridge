import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { handleOAuthCallback } from '@/components/salesforce/useSalesforceAuth';
import { ContractUploadDialog } from '@/components/salesforce/ContractUploadDialog';
import { Loader2 } from 'lucide-react';

const SalesforceCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [orgId, setOrgId] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        console.log('=== Callback Page Parameters ===');
        console.log('Code:', code);
        console.log('Error:', error);
        console.log('Error Description:', errorDescription);
        console.log('Full URL:', window.location.href);

        if (error) {
          throw new Error(`Salesforce Error: ${error} - ${errorDescription}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        const authData = await handleOAuthCallback(code);
        
        // Store the access token and instance URL
        localStorage.setItem('sf_access_token', authData.access_token);
        localStorage.setItem('sf_instance_url', authData.instance_url);
        localStorage.setItem('sf_token_timestamp', Date.now().toString());

        // Extract org ID from instance URL
        const orgIdMatch = authData.instance_url.match(/\/\/([^.]+)/);
        if (orgIdMatch) {
          setOrgId(orgIdMatch[1]);
        }

        toast({
          title: "Successfully connected!",
          description: "You are now connected to Salesforce.",
        });

        // Instead of showing the dialog immediately, redirect to home page
        navigate('/', { replace: true });

      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: error instanceof Error ? error.message : "Failed to complete Salesforce connection.",
        });
        navigate('/');
      }
    };

    processOAuthCallback();
  }, [navigate, toast]);

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
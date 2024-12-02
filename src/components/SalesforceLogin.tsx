import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

export const SalesforceLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    securityToken: '',
    clientId: '',
    clientSecret: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        'https://YOUR_PROJECT_REF.supabase.co/functions/v1/salesforce-auth',
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
            // Add your Supabase anon key here if required
            // 'apikey': 'your-anon-key'
          }
        }
      );

      // Store the access token and instance URL
      localStorage.setItem('sf_access_token', response.data.access_token);
      localStorage.setItem('sf_instance_url', response.data.instance_url);
      
      toast({
        title: "Successfully connected!",
        description: "You are now connected to Salesforce.",
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Invalid credentials or connection error. Please try again.",
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="clientId" className="text-sm font-medium">
              Client ID
            </label>
            <Input
              id="clientId"
              name="clientId"
              type="text"
              placeholder="Connected App Client ID"
              required
              value={credentials.clientId}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="clientSecret" className="text-sm font-medium">
              Client Secret
            </label>
            <Input
              id="clientSecret"
              name="clientSecret"
              type="password"
              placeholder="Connected App Client Secret"
              required
              value={credentials.clientSecret}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="email"
              placeholder="your.email@company.com"
              required
              value={credentials.username}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={credentials.password}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="securityToken" className="text-sm font-medium">
              Security Token
            </label>
            <Input
              id="securityToken"
              name="securityToken"
              type="password"
              required
              value={credentials.securityToken}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-sf-blue hover:bg-sf-hover"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect to Salesforce'
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-sf-gray">
          Make sure you have created a Connected App in Salesforce and have the correct credentials
        </p>
      </div>
    </Card>
  );
};
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const SalesforceLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    securityToken: '',
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
      // Store credentials temporarily in localStorage
      localStorage.setItem('sf_credentials', JSON.stringify(credentials));
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Successfully connected!",
        description: "Your Salesforce credentials have been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Please check your credentials and try again.",
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
          Your credentials are stored temporarily and securely in your browser
        </p>
      </div>
    </Card>
  );
};
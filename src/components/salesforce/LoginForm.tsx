import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onSubmit: (credentials: {
    clientId: string;
    clientSecret: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: '',
  });
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(credentials);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-center text-sf-blue mb-4">
        <Lock className="h-5 w-5 mr-2" />
        <span className="text-sm font-medium">Secure Connection</span>
      </div>

      <div className="space-y-2">
        <label htmlFor="clientId" className="text-sm font-medium">
          Client ID
        </label>
        <Input
          id="clientId"
          name="clientId"
          type="text"
          placeholder="Enter the Client ID from your Connected App"
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
          placeholder="Enter the Client Secret from your Connected App"
          required
          value={credentials.clientSecret}
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
  );
};
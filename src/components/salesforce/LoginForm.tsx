import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (credentials: {
    username: string;
    password: string;
    securityToken: string;
    clientId: string;
    clientSecret: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    securityToken: '',
    clientId: '',
    clientSecret: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(credentials);
  };

  return (
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
  );
};
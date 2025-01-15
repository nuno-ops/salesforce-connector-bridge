import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';

interface LoginFormProps {
  onSubmit: () => Promise<void>;
  isLoading: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-center text-gray-200 mb-4">
        <Lock className="h-5 w-5 mr-2" />
        <span className="text-sm font-medium">Secure Connection</span>
      </div>

      <Button
        type="submit"
        className="w-full h-14 px-8 text-lg font-medium bg-gradient-to-r from-sf-blue to-purple-600 hover:from-sf-hover hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105"
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
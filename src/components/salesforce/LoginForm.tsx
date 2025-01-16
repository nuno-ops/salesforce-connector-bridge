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

  const handleSupportClick = () => {
    window.location.href = "mailto:support@salesforcesaver.com";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center text-gray-200 mb-2">
          <Lock className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Secure Connection</span>
        </div>
        <p className="text-sm text-gray-400">
          Your data is protected with Salesforce's secure, approved Connected App for seamless integration
        </p>
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

      <button
        type="button"
        onClick={handleSupportClick}
        className="w-full text-sm text-gray-400 hover:text-gray-300 transition-colors"
      >
        Having trouble? Contact Support
      </button>
    </form>
  );
};
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
    <div className="space-y-12">
      <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
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
            'Connect & Start Saving'
          )}
        </Button>

        <div className="space-y-4 text-center">
          <button
            type="button"
            onClick={handleSupportClick}
            className="w-full text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Having trouble? Contact Support
          </button>
          <p className="text-xs text-gray-500">
            No changes will be made to your Salesforce data without your authorization.
          </p>
        </div>
      </form>

      <div className="rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-8 backdrop-blur-sm border border-white/20 shadow-lg">
        <h3 className="text-center text-white font-semibold text-lg mb-6">What do you gain?</h3>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="text-purple-300 font-medium">Reduce license costs</div>
          </div>
          <div className="space-y-2">
            <div className="text-blue-300 font-medium">Optimize storage usage</div>
          </div>
          <div className="space-y-2">
            <div className="text-indigo-300 font-medium">Save up to 10% annually</div>
          </div>
        </div>
      </div>
    </div>
  );
};
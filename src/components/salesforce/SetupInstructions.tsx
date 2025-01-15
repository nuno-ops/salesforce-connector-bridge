import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SetupInstructionsProps {
  callbackUrl: string;
}

export const SetupInstructions = ({ callbackUrl }: SetupInstructionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <CollapsibleTrigger className="flex items-center justify-center w-full h-14 px-8 text-lg font-medium bg-gradient-to-r from-sf-blue to-purple-600 hover:from-sf-hover hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105 rounded-md">
        {isOpen ? (
          <>
            <ChevronUp className="h-4 w-4 mr-1" />
            Hide setup instructions
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-1" />
            Need help setting up?
          </>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 text-left text-gray-200">
        <div className="space-y-2">
          <h3 className="font-medium">Step 1: Create a Connected App</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to Setup in your Salesforce org</li>
            <li>Search for "App Manager" in Quick Find</li>
            <li>Click "New Connected App"</li>
            <li>Fill in the basic information:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Connected App Name: SalesforceSaver</li>
                <li>API Name: will auto-populate</li>
                <li>Contact Email: your email</li>
              </ul>
            </li>
          </ol>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Step 2: Configure OAuth Settings</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Enable OAuth Settings</li>
            <li>Set Callback URL to: <span className="font-mono text-xs bg-black/30 px-2 py-1 rounded">{callbackUrl}</span></li>
            <li>Add OAuth Scopes:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Access and manage your data (api)</li>
                <li>Perform requests at any time (refresh_token, offline_access)</li>
              </ul>
            </li>
            <li>Save the Connected App</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Step 3: Get Credentials</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Wait a few minutes for the app to be created</li>
            <li>Go to Manage Connected Apps</li>
            <li>Find your Consumer Key (Client ID)</li>
            <li>Click to reveal and copy your Consumer Secret (Client Secret)</li>
          </ol>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
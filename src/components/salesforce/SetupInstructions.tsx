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
      <CollapsibleTrigger className="flex items-center justify-center w-full h-10 px-4 text-sm font-medium text-gray-400 hover:text-gray-300 transition-all duration-300 rounded-md">
        {isOpen ? (
          <>
            <ChevronUp className="h-4 w-4 mr-1" />
            Hide Setup Instructions
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-1" />
            Need help setting up?
          </>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-6 text-sm bg-gray-50 p-6 rounded-lg animate-fadeIn">
        <h3 className="font-bold text-lg mb-4">How to Create a Salesforce Connected App</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Step 1: Create a Connected App</h4>
            <ol className="list-decimal list-inside space-y-2">
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
            <h4 className="font-medium">Step 2: Configure OAuth Settings</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Enable OAuth Settings</li>
              <li>Set Callback URL:
                <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                  <code className="font-mono text-sm break-all select-all">{callbackUrl}</code>
                </div>
              </li>
              <li>Add OAuth Scopes:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Manage user data via APIs (api)</li>
                  <li>Manage user data via Web browsers (web)</li>
                  <li>Full access (full)</li>
                  <li>Perform requests at any time (refresh_token, offline_access)</li>
                </ul>
              </li>
              <li>Save the Connected App</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Step 3: Get Credentials</h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>Wait a few minutes for the app to be created</li>
              <li>Go to Manage Connected Apps</li>
              <li>Find your Consumer Key (Client ID)</li>
              <li>Click to reveal and copy your Consumer Secret (Client Secret)</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sf-blue">
          <p className="font-medium">Note:</p>
          <p>It may take a few minutes for your Connected App to be ready after creation. If you get an error, please wait 5-10 minutes and try again.</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
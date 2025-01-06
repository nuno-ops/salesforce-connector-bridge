import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Copy, Check, Mail } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SetupInstructionsProps {
  callbackUrl: string;
}

export const SetupInstructions = ({ callbackUrl }: SetupInstructionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-sf-blue hover:text-sf-hover transition-colors">
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
      <CollapsibleContent className="space-y-6 text-sm bg-gray-50 p-6 rounded-lg animate-fade-in">
        <h3 className="font-bold text-lg mb-4">How to Create a Salesforce Connected App</h3>
        <ol className="list-decimal space-y-4 text-sf-gray max-w-full">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>Log in to your Salesforce account as an administrator</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>Go to Setup (gear icon) → Apps → App Manager</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>Click "New Connected App" in the top-right</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <div className="flex-1">
              <p>Fill in the basic information:</p>
              <ul className="list-disc ml-4 mt-2 space-y-2 break-words">
                <li>Connected App Name: "Cost Optimization App"</li>
                <li>API Name: will auto-fill</li>
                <li>Contact Email: your email</li>
              </ul>
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2">5.</span>
            <div className="flex-1">
              <p>Enable OAuth Settings:</p>
              <ul className="list-disc ml-4 mt-2 space-y-2">
                <li>Check "Enable OAuth Settings"</li>
                <li className="flex flex-col space-y-2 w-full">
                  <span className="font-medium">Callback URL:</span>
                  <div className="flex items-center space-x-2 bg-white p-2 rounded-md w-full">
                    <code className="flex-1 break-all px-2 py-1">{callbackUrl}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyCallbackUrl}
                      className="shrink-0"
                    >
                      {copiedUrl ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </li>
                <li>Selected OAuth Scopes: Add "Full access (full)"</li>
              </ul>
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2">6.</span>
            <span>Click "Save" and wait for confirmation</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">7.</span>
            <span>Copy the Consumer Key (Client ID) and Consumer Secret (Client Secret)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">8.</span>
            <span>Paste these credentials in the form above</span>
          </li>
        </ol>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sf-blue">
          <p className="font-medium">Note:</p>
          <p>It may take a few minutes for your Connected App to be ready after creation. If you get an error, please wait 5-10 minutes and try again.</p>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-sf-blue border-t pt-4">
          <Mail className="h-4 w-4" />
          <a 
            href="mailto:support@salesforcesaver.com"
            className="hover:underline"
          >
            Need help? Contact our support team
          </a>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
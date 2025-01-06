import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SetupStepsList } from './setup/SetupStepsList';
import { SupportSection } from './setup/SupportSection';

interface SetupInstructionsProps {
  callbackUrl: string;
}

export const SetupInstructions = ({ callbackUrl }: SetupInstructionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
        
        <SetupStepsList callbackUrl={callbackUrl} />

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sf-blue">
          <p className="font-medium">Note:</p>
          <p>It may take a few minutes for your Connected App to be ready after creation. If you get an error, please wait 5-10 minutes and try again.</p>
        </div>
        
        <SupportSection />
      </CollapsibleContent>
    </Collapsible>
  );
};
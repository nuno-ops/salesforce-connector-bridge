import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface CallbackUrlSectionProps {
  callbackUrl: string;
}

export const CallbackUrlSection = ({ callbackUrl }: CallbackUrlSectionProps) => {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
      <div className="flex items-center gap-2 text-sf-blue">
        <Info className="h-5 w-5" />
        <span className="font-medium">Required Callback URL</span>
      </div>
      <div className="flex items-center space-x-2 bg-white p-2 rounded-md w-full border-2 border-blue-100">
        <code className="flex-1 break-all px-2 py-1 text-sm font-mono bg-gray-50 rounded">{callbackUrl}</code>
        <Button
          variant="outline"
          size="sm"
          onClick={copyCallbackUrl}
          className="shrink-0 hover:bg-blue-50"
        >
          {copiedUrl ? "Copied!" : "Copy URL"}
        </Button>
      </div>
      <p className="text-sm text-sf-blue">
        Copy this URL and paste it in your Connected App's Callback URL field.
      </p>
    </div>
  );
};
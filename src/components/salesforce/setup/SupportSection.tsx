import React from 'react';
import { Mail } from 'lucide-react';

export const SupportSection = () => {
  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-sf-blue border-t pt-4">
      <Mail className="h-4 w-4" />
      <a 
        href="mailto:support@salesforcesaver.com"
        className="hover:underline"
      >
        Need help? Contact our support team
      </a>
    </div>
  );
};
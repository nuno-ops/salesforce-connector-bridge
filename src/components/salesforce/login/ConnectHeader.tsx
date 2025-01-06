import React from 'react';
import { Lock } from 'lucide-react';

export const ConnectHeader = () => {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Connect to Salesforce</h1>
      <p className="text-sm text-sf-gray">
        Enter your Salesforce Connected App credentials
      </p>
    </div>
  );
};
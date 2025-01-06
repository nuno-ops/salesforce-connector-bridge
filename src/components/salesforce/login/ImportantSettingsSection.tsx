import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ImportantSettingsSection = () => {
  return (
    <div className="bg-red-50 p-4 rounded-lg space-y-2">
      <div className="flex items-center gap-2 text-red-800">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <span className="font-medium">Important Setting to Disable:</span>
      </div>
      <p className="text-red-800">
        Make sure to uncheck "Require Proof Key for Code Exchange (PKCE) Extension for Supported Authorization Flows" in the Connected App settings.
      </p>
    </div>
  );
};
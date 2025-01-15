import React from 'react';
import { Check, Info } from 'lucide-react';

const REQUIRED_SCOPES = [
  "Manage user data via APIs (api)",
  "Manage user data via Web browsers (web)",
  "Full access (full)",
  "Perform requests at any time (refresh_token, offline_access)"
];

export const RequiredScopesSection = () => {
  return (
    <div className="bg-yellow-50 p-4 rounded-lg space-y-2">
      <div className="flex items-center gap-2 text-yellow-800">
        <Info className="h-5 w-5" />
        <span className="font-medium">Required OAuth Scopes:</span>
      </div>
      <ul className="list-none space-y-2">
        {REQUIRED_SCOPES.map((scope, index) => (
          <li key={index} className="flex items-center text-yellow-700">
            <Check className="h-4 w-4 mr-2 text-yellow-600" />
            {scope}
          </li>
        ))}
      </ul>
    </div>
  );
};
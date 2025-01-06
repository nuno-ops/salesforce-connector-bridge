import React from 'react';
import { RequiredScopesSection } from '../login/RequiredScopesSection';
import { ImportantSettingsSection } from '../login/ImportantSettingsSection';

interface SetupStepsListProps {
  callbackUrl: string;
}

export const SetupStepsList = ({ callbackUrl }: SetupStepsListProps) => {
  return (
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
              <code className="bg-white p-2 rounded-md break-all">{callbackUrl}</code>
            </li>
          </ul>
        </div>
      </li>
      <li className="flex items-start">
        <span className="mr-2">6.</span>
        <div className="flex-1">
          <p>Configure OAuth Scopes:</p>
          <RequiredScopesSection />
          <ImportantSettingsSection />
        </div>
      </li>
      <li className="flex items-start">
        <span className="mr-2">7.</span>
        <span>Click "Save" and wait for confirmation</span>
      </li>
      <li className="flex items-start">
        <span className="mr-2">8.</span>
        <div className="flex-1">
          <p>Click the "Manage Consumer Details" button to reveal your credentials</p>
          <p className="text-sm text-gray-600 mt-1">Note: You might need to wait a few minutes before this button becomes active</p>
        </div>
      </li>
      <li className="flex items-start">
        <span className="mr-2">9.</span>
        <span>Copy the Consumer Key (Client ID) and Consumer Secret (Client Secret)</span>
      </li>
      <li className="flex items-start">
        <span className="mr-2">10.</span>
        <span>Paste these credentials in the form above</span>
      </li>
      <li className="flex items-start">
        <span className="mr-2">11.</span>
        <div className="flex-1">
          <p>Click "Connect to Salesforce" and complete the authentication:</p>
          <ul className="list-disc ml-4 mt-2 text-sm">
            <li>A Salesforce login form will appear</li>
            <li>Log in with your Salesforce credentials</li>
            <li>Review and accept the requested permissions</li>
          </ul>
        </div>
      </li>
    </ol>
  );
};
import { Activity } from "lucide-react";
import { OrgHealth } from "@/components/OrgHealth";

export const OrganizationHealthSection = () => {
  return (
    <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-full bg-gray-100">
          <Activity className="h-5 w-5 text-sf-text-secondary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-sf-text-primary">Organization Health</h3>
          <p className="text-sf-text-secondary">Monitor your Salesforce organization's health</p>
        </div>
      </div>
      <div id="org-health">
        <OrgHealth />
      </div>
    </section>
  );
};
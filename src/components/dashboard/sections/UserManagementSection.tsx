import { Users } from "lucide-react";
import { SalesforceUsers } from "@/components/SalesforceUsers";

export const UserManagementSection = () => {
  return (
    <section className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-full bg-gray-100">
          <Users className="h-5 w-5 text-sf-text-secondary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-sf-text-primary">User Management</h3>
          <p className="text-sf-text-secondary">Review and manage Salesforce users</p>
        </div>
      </div>
      <div id="users">
        <SalesforceUsers />
      </div>
    </section>
  );
};
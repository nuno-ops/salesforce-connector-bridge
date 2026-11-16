import { ConnectForm } from "@/components/app/connect-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Shown instead of a report on sandbox orgs. A sandbox copies production's users and licences,
 * so seat checks there would count savings that don't exist on the bill.
 */
export function SandboxNotice() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>This is a sandbox. Connect production to see your savings.</CardTitle>
        <CardDescription>
          A sandbox is a copy of your production org: its users, licences and logins aren&apos;t what Salesforce bills you for, so
          any savings found here wouldn&apos;t be real. Connect the org your team works in every day.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectForm />
      </CardContent>
    </Card>
  );
}

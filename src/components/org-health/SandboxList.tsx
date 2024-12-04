import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SandboxInfo {
  Id: string;
  SandboxName: string;
  LicenseType: string;
  Description: string;
}

interface SandboxListProps {
  sandboxes: SandboxInfo[];
}

export const SandboxList = ({ sandboxes }: SandboxListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sandboxes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sandboxes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sandboxes found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sandboxes.map((sandbox) => (
                <div key={sandbox.Id} className="p-4 border rounded-lg">
                  <h3 className="font-medium">{sandbox.SandboxName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{sandbox.LicenseType}</p>
                  {sandbox.Description && (
                    <p className="text-sm text-muted-foreground mt-2">{sandbox.Description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LicenseInfo {
  name: string;
  total: number;
  used: number;
  status?: string;
}

interface LicenseCardProps {
  title: string;
  licenses: LicenseInfo[];
}

export const LicenseCard = ({ title, licenses }: LicenseCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {licenses.map((license, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h3 className="font-medium">{license.name}</h3>
              <div className="text-sm text-muted-foreground mt-2">
                <p>Used: {license.used} / {license.total}</p>
                <p>Available: {license.total - license.used}</p>
                {license.status && <p className="mt-1">Status: {license.status}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
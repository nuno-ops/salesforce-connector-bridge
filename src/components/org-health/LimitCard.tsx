import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LimitCardProps {
  title: string;
  max: number;
  remaining: number;
  unit?: string;
}

export const LimitCard = ({ title, max, remaining, unit = '' }: LimitCardProps) => {
  const used = max - remaining;
  const percentage = Math.round((used / max) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={percentage} />
          <div className="text-sm text-muted-foreground">
            Used: {used} {unit}/ {max} {unit} ({percentage}%)
          </div>
          <div className="text-sm text-muted-foreground">
            Remaining: {remaining} {unit}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
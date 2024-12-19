import { LimitCard } from './LimitCard';
import { OrgLimits } from './types';

interface LimitsSectionProps {
  limits: OrgLimits;
}

export const LimitsSection = ({ limits }: LimitsSectionProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <LimitCard
        title="Data Storage"
        max={limits.DataStorageMB.Max}
        remaining={limits.DataStorageMB.Remaining}
        unit="MB"
      />
      <LimitCard
        title="File Storage"
        max={limits.FileStorageMB.Max}
        remaining={limits.FileStorageMB.Remaining}
        unit="MB"
      />
      <LimitCard
        title="Daily API Requests"
        max={limits.DailyApiRequests.Max}
        remaining={limits.DailyApiRequests.Remaining}
      />
    </div>
  );
};
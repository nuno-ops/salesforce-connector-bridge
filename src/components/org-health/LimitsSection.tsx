import { useState, useEffect } from 'react';
import { LimitCard } from './LimitCard';
import { OrgLimits } from './types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

interface LimitsSectionProps {
  limits: OrgLimits;
  defaultExpanded?: boolean;
}

export const LimitsSection = ({ limits, defaultExpanded = false }: LimitsSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  useEffect(() => {
    setIsOpen(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Organization Limits</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8"
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
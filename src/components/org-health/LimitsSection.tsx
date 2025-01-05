import { useState, useEffect } from 'react';
import { LimitCard } from './LimitCard';
import { OrgLimits } from './types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

interface LimitsSectionProps {
  limits?: OrgLimits;
  defaultExpanded?: boolean;
}

export const LimitsSection = ({ limits, defaultExpanded = false }: LimitsSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  useEffect(() => {
    setIsOpen(defaultExpanded);
  }, [defaultExpanded]);

  // Add null check for limits
  if (!limits) {
    console.log('LimitsSection: No limits data available');
    return null;
  }

  // Ensure all required properties exist with default values
  const dataStorage = limits.DataStorageMB || { Max: 0, Remaining: 0 };
  const fileStorage = limits.FileStorageMB || { Max: 0, Remaining: 0 };
  const apiRequests = limits.DailyApiRequests || { Max: 0, Remaining: 0 };

  console.log('LimitsSection rendering with data:', {
    dataStorage,
    fileStorage,
    apiRequests
  });

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
              max={dataStorage.Max}
              remaining={dataStorage.Remaining}
              unit="MB"
            />
            <LimitCard
              title="File Storage"
              max={fileStorage.Max}
              remaining={fileStorage.Remaining}
              unit="MB"
            />
            <LimitCard
              title="Daily API Requests"
              max={apiRequests.Max}
              remaining={apiRequests.Remaining}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
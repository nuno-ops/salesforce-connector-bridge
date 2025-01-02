import { useState, useEffect } from 'react';
import { LicenseCard } from './LicenseCard';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

interface LicensesSectionProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  defaultExpanded?: boolean;
}

export const LicensesSection = ({ 
  userLicenses, 
  packageLicenses, 
  permissionSetLicenses,
  defaultExpanded = false
}: LicensesSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  useEffect(() => {
    setIsOpen(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Licenses</h2>
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
          <div className="space-y-6 pt-4">
            <LicenseCard 
              title="User Licenses" 
              licenses={userLicenses}
              type="user"
            />
            <LicenseCard 
              title="Package Licenses" 
              licenses={packageLicenses}
              type="package"
            />
            <LicenseCard 
              title="Permission Set Licenses" 
              licenses={permissionSetLicenses}
              type="permissionSet"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
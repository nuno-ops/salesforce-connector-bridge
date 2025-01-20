import { LicenseCard } from './LicenseCard';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

interface LicensesSectionProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export const LicensesSection = ({ 
  userLicenses, 
  packageLicenses, 
  permissionSetLicenses,
  isOpen = false,
  onOpenChange
}: LicensesSectionProps) => {
  console.log('LicensesSection received:', {
    userLicenses,
    packageLicenses,
    permissionSetLicenses,
    isUserLicensesArray: Array.isArray(userLicenses),
    userLicensesLength: userLicenses?.length,
    isPackageLicensesArray: Array.isArray(packageLicenses),
    packageLicensesLength: packageLicenses?.length,
    isPermissionSetLicensesArray: Array.isArray(permissionSetLicenses),
    permissionSetLicensesLength: permissionSetLicenses?.length,
    isOpen
  });

  // Ensure we're working with arrays and not strings
  const parsedUserLicenses = Array.isArray(userLicenses) ? userLicenses : [];
  const parsedPackageLicenses = Array.isArray(packageLicenses) ? packageLicenses : [];
  const parsedPermissionSetLicenses = Array.isArray(permissionSetLicenses) ? permissionSetLicenses : [];

  console.log('LicensesSection after parsing:', {
    parsedUserLicenses,
    parsedPackageLicenses,
    parsedPermissionSetLicenses,
    parsedUserLicensesLength: parsedUserLicenses.length,
    parsedPackageLicensesLength: parsedPackageLicenses.length,
    parsedPermissionSetLicensesLength: parsedPermissionSetLicenses.length
  });

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Licenses</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onOpenChange?.(!isOpen)}
          className="h-8 w-8"
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleContent>
          <div className="space-y-6 pt-4">
            <LicenseCard 
              title="User Licenses" 
              licenses={parsedUserLicenses}
              type="user"
            />
            <LicenseCard 
              title="Package Licenses" 
              licenses={parsedPackageLicenses}
              type="package"
            />
            <LicenseCard 
              title="Permission Set Licenses" 
              licenses={parsedPermissionSetLicenses}
              type="permissionSet"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
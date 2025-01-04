import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LICENSE_TOOLTIPS, PERMISSION_SET_DESCRIPTIONS } from "../utils/licenseDescriptions";
import { LicenseInfo } from "../types";
import { groupLicensesByType } from "../utils/licenseGrouping";

interface LicenseCardContentProps {
  licenses: LicenseInfo[];
  searchTerm: string;
  type: 'user' | 'package' | 'permissionSet';
}

export const LicenseCardContent = ({ 
  licenses, 
  searchTerm, 
  type 
}: LicenseCardContentProps) => {
  console.log('LicenseCardContent received:', {
    licensesLength: licenses?.length,
    firstLicense: licenses?.[0],
    searchTerm,
    type
  });

  const getUsageColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage < 30) return 'text-red-500';
    if (percentage < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const groupedLicenses = groupLicensesByType(licenses, type);
  console.log('Grouped licenses details:', {
    groupCount: Object.keys(groupedLicenses).length,
    groups: Object.keys(groupedLicenses),
    firstGroupSize: Object.values(groupedLicenses)[0]?.length
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedLicenses).map(([group, groupLicenses]) => (
        <div key={group} className="space-y-2">
          <h3 className="font-medium text-lg">{group}</h3>
          <div className="grid gap-4">
            {(groupLicenses as LicenseInfo[]).map((license, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{license.name || 'Unknown'}</h4>
                          <div className="text-sm text-muted-foreground mt-1">
                            <p>Used: {license.used} / {license.total}</p>
                            <p>Available: {license.total - license.used}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${getUsageColor(license.used, license.total)}`}>
                          {((license.used / license.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {type === 'permissionSet' ? (
                      <p>{PERMISSION_SET_DESCRIPTIONS[group as keyof typeof PERMISSION_SET_DESCRIPTIONS] || 
                         'Provides specific feature access'}</p>
                    ) : (
                      <p>{LICENSE_TOOLTIPS[license.name as keyof typeof LICENSE_TOOLTIPS] || 
                         'Provides Salesforce access and features'}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LicenseInfo {
  name: string;
  total: number;
  used: number;
  status?: string;
  featureArea?: string;
  lastModified?: string;
}

interface LicenseCardProps {
  title: string;
  licenses: LicenseInfo[];
  type: 'user' | 'package' | 'permissionSet';
}

const LICENSE_TOOLTIPS = {
  'Salesforce': 'Full CRM functionality including sales and service features',
  'Platform': 'Custom app and object access with limited standard features',
  'Identity': 'Authentication and basic Salesforce access',
  'Guest': 'Limited access for external users',
};

const PERMISSION_SET_DESCRIPTIONS = {
  'Sales': 'Access to sales-specific features and objects',
  'Service': 'Access to service and support features',
  'Platform': 'Access to platform administration features',
  'Marketing': 'Access to marketing features and campaigns',
  'Analytics': 'Access to reporting and dashboard features',
};

export const LicenseCard = ({ title, licenses, type }: LicenseCardProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const getUsageColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage < 30) return 'text-red-500';
    if (percentage < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const groupLicensesByType = () => {
    if (type === 'package') {
      return licenses.reduce((acc: { [key: string]: LicenseInfo[] }, license) => {
        const status = license.status || 'Active';
        if (!acc[status]) acc[status] = [];
        acc[status].push(license);
        return acc;
      }, {});
    }
    
    if (type === 'permissionSet') {
      return licenses.reduce((acc: { [key: string]: LicenseInfo[] }, license) => {
        const area = getFeatureArea(license.name);
        if (!acc[area]) acc[area] = [];
        acc[area].push(license);
        return acc;
      }, {});
    }

    // For user licenses, group by license type
    return licenses.reduce((acc: { [key: string]: LicenseInfo[] }, license) => {
      const type = getLicenseType(license.name);
      if (!acc[type]) acc[type] = [];
      acc[type].push(license);
      return acc;
    }, {});
  };

  const getFeatureArea = (name: string): string => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('sales')) return 'Sales';
    if (lowercaseName.includes('service')) return 'Service';
    if (lowercaseName.includes('platform')) return 'Platform';
    if (lowercaseName.includes('marketing')) return 'Marketing';
    if (lowercaseName.includes('analytics')) return 'Analytics';
    return 'Other';
  };

  const getLicenseType = (name: string): string => {
    if (name.includes('Platform')) return 'Platform';
    if (name.includes('Identity')) return 'Identity';
    if (name.includes('Guest')) return 'Guest';
    return 'Full CRM';
  };

  const filteredLicenses = licenses.filter(license =>
    license.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedLicenses = groupLicensesByType();

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Total', 'Used', 'Available', 'Usage %'].join(','),
      ...licenses.map(license => [
        license.name,
        license.total,
        license.used,
        license.total - license.used,
        ((license.used / license.total) * 100).toFixed(1) + '%'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(' ', '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
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
      </CardHeader>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <div className="mb-4">
              <Input
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="space-y-6">
              {Object.entries(groupedLicenses).map(([group, groupLicenses]) => (
                <div key={group} className="space-y-2">
                  <h3 className="font-medium text-lg">{group}</h3>
                  <div className="grid gap-4">
                    {(groupLicenses as LicenseInfo[])
                      .filter(license => 
                        license.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((license, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium">{license.name}</h4>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      <p>Used: {license.used} / {license.total}</p>
                                      <p>Available: {license.total - license.used}</p>
                                      {license.status && (
                                        <p className="mt-1">Status: {license.status}</p>
                                      )}
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
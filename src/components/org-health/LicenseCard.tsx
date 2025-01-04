import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LicenseCardHeader } from "./license-card/LicenseCardHeader";
import { LicenseCardContent } from "./license-card/LicenseCardContent";
import { LicenseInfo } from "./types";

interface LicenseCardProps {
  title: string;
  licenses: LicenseInfo[];
  type: 'user' | 'package' | 'permissionSet';
}

export const LicenseCard = ({ title, licenses = [], type }: LicenseCardProps) => {
  console.log('LicenseCard render:', { title, type, licenses });
  
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Total', 'Used', 'Available', 'Usage %'].join(','),
      ...licenses.map(license => [
        license.name || 'Unknown',
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

  const filteredLicenses = licenses.filter(license => {
    console.log('Filtering license:', license);
    const searchResult = (license.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    console.log('Search result for', license.name, ':', searchResult);
    return searchResult;
  });

  console.log('Filtered licenses:', filteredLicenses);

  return (
    <Card>
      <LicenseCardHeader 
        title={title}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onExport={handleExport}
      />
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
            <LicenseCardContent 
              licenses={filteredLicenses}
              searchTerm={searchTerm}
              type={type}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

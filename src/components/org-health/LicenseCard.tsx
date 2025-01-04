import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { LicenseCardHeader } from "./license-card/LicenseCardHeader";
import { LicenseCardContent } from "./license-card/LicenseCardContent";
import { LicenseInfo } from "./types";
import { useState } from "react";

interface LicenseCardProps {
  title: string;
  licenses: LicenseInfo[];
  type: 'user' | 'package' | 'permissionSet';
}

export const LicenseCard = ({ title, licenses = [], type }: LicenseCardProps) => {
  console.log(`LicenseCard [${title}] render with:`, {
    licensesLength: licenses?.length,
    firstLicense: licenses?.[0],
    type
  });
  
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter licenses based on search term
  const filteredLicenses = licenses.filter(license => {
    if (!license?.name) {
      console.warn('License missing name property:', license);
      return false;
    }
    const result = license.name.toLowerCase().includes(searchTerm.toLowerCase());
    return result;
  });

  console.log(`LicenseCard [${title}] filtered licenses:`, {
    original: licenses?.length,
    filtered: filteredLicenses?.length,
    searchTerm
  });

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Total', 'Used', 'Available', 'Usage %'].join(','),
      ...filteredLicenses.map(license => [
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

import { useState } from 'react';
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useExportReport } from "./useExportReport";
import { NavigationLinks } from "./sidebar/NavigationLinks";
import { ActionLinks } from "./sidebar/ActionLinks";
import { scrollToSection } from "../cost-savings/utils/scrollUtils";

interface DashboardSidebarProps {
  onDisconnect?: () => void;
  userLicenses?: any[];
  packageLicenses?: any[];
  permissionSetLicenses?: any[];
  sandboxes?: any[];
  limits?: any;
  users?: any[];
  oauthTokens?: any[];
  savingsBreakdown?: any[];
  totalSavings?: number;
  showSavingsFeatures?: boolean;
  licensePrice?: number;
}

export function DashboardSidebar({ 
  onDisconnect,
  userLicenses = [],
  packageLicenses = [],
  permissionSetLicenses = [],
  sandboxes = [],
  limits = {},
  users = [],
  oauthTokens = [],
  savingsBreakdown = [],
  totalSavings = 0,
  showSavingsFeatures = true,
  licensePrice = 0,
}: DashboardSidebarProps) {
  const [open, setOpen] = useState(false);
  const { isExporting, handleExport } = useExportReport();
  
  const handleLinkClick = (href: string) => {
    console.log('Sidebar link clicked:', href);
    const sectionId = href.replace('#', '');
    
    if (sectionId === 'license-optimization') {
      const event = new CustomEvent('expandSection', {
        detail: { sectionId, tabValue: 'inactive' }
      });
      window.dispatchEvent(event);
    } else {
      const event = new CustomEvent('expandSection', {
        detail: { sectionId }
      });
      window.dispatchEvent(event);
      scrollToSection(sectionId);
    }
  };

  const handleExportClick = () => {
    console.log('Export clicked with license price:', licensePrice);

    const exportData = {
      userLicenses,
      packageLicenses,
      permissionSetLicenses,
      sandboxes,
      limits,
      users,
      oauthTokens,
      savingsBreakdown,
      standardUsers: users,
      storageUsage: limits?.StorageUsed || 0,
      licensePrice, // Use the actual license price passed from props
    };
    
    handleExport(exportData);
  };
  
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-6">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mt-6 flex flex-col gap-1.5">
            {showSavingsFeatures && (
              <NavigationLinks onLinkClick={handleLinkClick} />
            )}
            
            <Separator className="my-3" />

            <ActionLinks 
              onDisconnect={onDisconnect}
              onExport={handleExportClick}
              isExporting={isExporting}
            />
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
import React, { useState } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { BarChart2, Package, Database, Box, HardDrive, Activity, HelpCircle, LogOut, Download, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ConsultationButton } from "../consultation/ConsultationButton";
import { scrollToSection } from "../cost-savings/utils/scrollUtils";
import { Button } from "../ui/button";
import { useExportReport } from "./useExportReport";

const navigationLinks = [
  {
    label: "Cost Savings",
    href: "#cost-savings",
    icon: <BarChart2 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Tool Analysis",
    href: "#tool-analysis",
    icon: <Activity className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "License Optimization",
    href: "#license-optimization",
    icon: <Package className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Licenses",
    href: "#licenses",
    icon: <Database className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Organization Limits",
    href: "#organization-limits",
    icon: <Box className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Operational Metrics",
    href: "#operational-metrics",
    icon: <Activity className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Active Sandboxes",
    href: "#active-sandboxes",
    icon: <HardDrive className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
];

interface DashboardSidebarProps {
  onDisconnect?: () => void;
  userLicenses?: any[];
  packageLicenses?: any[];
  permissionSetLicenses?: any[];
  sandboxes?: any[];
  limits?: any;
  users?: any[];
  oauthTokens?: any[];
  inactiveUsers?: any[];
  integrationUsers?: any[];
  platformUsers?: any[];
  savingsBreakdown?: any[];
  licensePrice?: number;
  showSavingsFeatures?: boolean;
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
  inactiveUsers = [],
  integrationUsers = [],
  platformUsers = [],
  savingsBreakdown = [],
  licensePrice = 0,
  showSavingsFeatures = true,
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
    handleExport({
      userLicenses,
      packageLicenses,
      permissionSetLicenses,
      sandboxes,
      limits,
      users,
      oauthTokens,
      inactiveUsers,
      integrationUsers,
      platformUsers,
      savingsBreakdown,
      licensePrice,
    });
  };

  const actionLinks = [
    {
      label: "Book a Consultation",
      href: "#consultation",
      icon: <HelpCircle className="text-sf-blue dark:text-sf-blue h-4 w-4 flex-shrink-0" />,
      onClick: () => {
        const consultButton = document.querySelector('[aria-label="Book a consultation"]') as HTMLButtonElement;
        if (consultButton) {
          consultButton.click();
        }
      },
      highlight: true
    },
    {
      label: "Contact Support",
      href: "mailto:support@salesforcesaver.com",
      icon: <Mail className="text-neutral-700 dark:text-neutral-200 h-4 w-4 flex-shrink-0" />,
      onClick: () => {
        window.location.href = "mailto:support@salesforcesaver.com";
      }
    },
    {
      label: "Disconnect",
      href: "#disconnect",
      icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-4 w-4 flex-shrink-0" />,
      onClick: onDisconnect
    }
  ];
  
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-6">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mt-6 flex flex-col gap-1.5">
            {showSavingsFeatures && navigationLinks.map((link, idx) => (
              <div key={idx} onClick={() => handleLinkClick(link.href)}>
                <SidebarLink link={{
                  ...link,
                  icon: React.cloneElement(link.icon as React.ReactElement, {
                    className: "text-neutral-700 dark:text-neutral-200 h-4 w-4 flex-shrink-0"
                  })
                }} />
              </div>
            ))}
            
            <Separator className="my-3" />

            <div onClick={handleExportClick} className="cursor-pointer">
              <SidebarLink 
                link={{
                  label: "Export Report",
                  href: "#export",
                  icon: <Download className="text-neutral-700 dark:text-neutral-200 h-4 w-4 flex-shrink-0" />
                }}
              />
            </div>
            
            {actionLinks.map((link, idx) => (
              <div 
                key={`action-${idx}`} 
                onClick={link.onClick}
                className={`cursor-pointer transition-all duration-200 ${
                  link.highlight ? 'bg-sf-light hover:bg-sf-light/80 rounded-md' : ''
                }`}
              >
                <SidebarLink link={link} />
              </div>
            ))}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
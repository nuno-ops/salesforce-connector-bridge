import { useState } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { BarChart2, Package, Database, Box, HardDrive, Activity, HelpCircle, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ConsultationButton } from "../consultation/ConsultationButton";
import { scrollToSection } from "../cost-savings/utils/scrollUtils";

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
}

export function DashboardSidebar({ onDisconnect }: DashboardSidebarProps) {
  const [open, setOpen] = useState(false);
  
  const handleLinkClick = (href: string) => {
    console.log('Sidebar link clicked:', href);
    const sectionId = href.replace('#', '');
    
    // Special handling for license optimization section
    if (sectionId === 'license-optimization') {
      const event = new CustomEvent('expandSection', {
        detail: { sectionId, tabValue: 'inactive' }
      });
      window.dispatchEvent(event);
    } else {
      // Regular sections
      const event = new CustomEvent('expandSection', {
        detail: { sectionId }
      });
      window.dispatchEvent(event);
      // Add smooth scrolling for all sections
      scrollToSection(sectionId);
    }
  };

  const actionLinks = [
    {
      label: "Book a Consultation",
      href: "#consultation",
      icon: <HelpCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => {
        const consultButton = document.querySelector('[aria-label="Book a consultation"]') as HTMLButtonElement;
        if (consultButton) {
          consultButton.click();
        }
      }
    },
    {
      label: "Disconnect",
      href: "#disconnect",
      icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: onDisconnect
    }
  ];
  
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mt-8 flex flex-col gap-2">
            {navigationLinks.map((link, idx) => (
              <div key={idx} onClick={() => handleLinkClick(link.href)}>
                <SidebarLink link={link} />
              </div>
            ))}
            
            <Separator className="my-4" />
            
            {actionLinks.map((link, idx) => (
              <div 
                key={`action-${idx}`} 
                onClick={link.onClick}
                className="cursor-pointer"
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
import React from 'react';
import { BarChart2, Package, Database, Box, HardDrive, Activity } from "lucide-react";
import { SidebarLink } from "@/components/ui/sidebar";
import { scrollToSection } from "../../cost-savings/utils/scrollUtils";

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

interface NavigationLinksProps {
  onLinkClick: (href: string) => void;
}

export const NavigationLinks = ({ onLinkClick }: NavigationLinksProps) => {
  return (
    <>
      {navigationLinks.map((link, idx) => (
        <div key={idx} onClick={() => onLinkClick(link.href)}>
          <SidebarLink link={{
            ...link,
            icon: React.cloneElement(link.icon as React.ReactElement, {
              className: "text-neutral-700 dark:text-neutral-200 h-4 w-4 flex-shrink-0"
            })
          }} />
        </div>
      ))}
    </>
  );
};
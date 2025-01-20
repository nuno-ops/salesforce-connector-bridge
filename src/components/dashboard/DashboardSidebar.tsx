import { useState } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { BarChart2, Package, Database, Box, HardDrive, Users, Activity } from "lucide-react";

const links = [
  {
    label: "Cost Savings",
    href: "#cost-savings",
    icon: <BarChart2 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
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
    label: "Active Sandboxes",
    href: "#active-sandboxes",
    icon: <HardDrive className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Users",
    href: "#users",
    icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Operational Metrics",
    href: "#operational-metrics",
    icon: <Activity className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
];

export function DashboardSidebar() {
  const [open, setOpen] = useState(false);
  
  const handleLinkClick = (href: string) => {
    console.log('Sidebar link clicked:', href);
    // Dispatch a custom event to notify that a section should be expanded
    const event = new CustomEvent('expandLicenseSection', {
      detail: { tabValue: href.replace('#', '') }
    });
    window.dispatchEvent(event);
  };
  
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <div key={idx} onClick={() => handleLinkClick(link.href)}>
                <SidebarLink link={link} />
              </div>
            ))}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
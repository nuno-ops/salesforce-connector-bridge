import { HelpCircle, LogOut, Download, Mail } from "lucide-react";
import { SidebarLink } from "@/components/ui/sidebar";
import { useConsultation } from "./useConsultation";

interface ActionLinksProps {
  onDisconnect?: () => void;
  onExport: () => void;
  isExporting?: boolean;
}

export const ActionLinks = ({ onDisconnect, onExport, isExporting = false }: ActionLinksProps) => {
  const { handleConsultation } = useConsultation();

  const actionLinks = [
    {
      label: "Book a Consultation",
      href: "#consultation",
      icon: <HelpCircle className="text-sf-blue dark:text-sf-blue h-4 w-4 flex-shrink-0" />,
      onClick: handleConsultation,
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
    <>
      <div onClick={onExport} className="cursor-pointer">
        <SidebarLink 
          link={{
            label: isExporting ? "Exporting..." : "Export Report",
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
    </>
  );
};
import { LicenseCard } from './LicenseCard';
import { formatLicenseData, formatPackageLicenseData, formatPermissionSetLicenseData } from './utils';

interface LicensesSectionProps {
  userLicenses: any[];
  packageLicenses: any[];
  permissionSetLicenses: any[];
}

export const LicensesSection = ({ 
  userLicenses, 
  packageLicenses, 
  permissionSetLicenses 
}: LicensesSectionProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <LicenseCard 
        title="User Licenses" 
        licenses={formatLicenseData(userLicenses)} 
      />
      <LicenseCard 
        title="Package Licenses" 
        licenses={formatPackageLicenseData(packageLicenses)} 
      />
      <LicenseCard 
        title="Permission Set Licenses" 
        licenses={formatPermissionSetLicenseData(permissionSetLicenses)} 
      />
    </div>
  );
};
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
    <div className="space-y-6">
      <LicenseCard 
        title="User Licenses" 
        licenses={formatLicenseData(userLicenses)}
        type="user"
      />
      <LicenseCard 
        title="Package Licenses" 
        licenses={formatPackageLicenseData(packageLicenses)}
        type="package"
      />
      <LicenseCard 
        title="Permission Set Licenses" 
        licenses={formatPermissionSetLicenseData(permissionSetLicenses)}
        type="permissionSet"
      />
    </div>
  );
};
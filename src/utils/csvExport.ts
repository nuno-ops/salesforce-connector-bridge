import { ExportData } from '@/utils/csv/types';
import { createLicenseSection } from '@/utils/csv/sections/licenseSection';
import { createSandboxSection } from '@/utils/csv/sections/sandboxSection';
import { createLimitsSection } from '@/utils/csv/sections/limitsSection';
import { createUserSection } from '@/utils/csv/sections/userSection';
import { filterStandardSalesforceUsers, filterInactiveUsers } from '@/components/users/utils/userFilters';
import { 
  calculateInactiveUserSavings,
  calculateIntegrationUserSavings,
  calculateSandboxSavings,
  calculateStorageSavings
} from '@/components/cost-savings/utils/savingsCalculations';
import { calculatePlatformLicenseSavings } from '@/components/cost-savings/utils/platformLicenseSavings';
import { generateSavingsReportContent } from './csv/generators/savingsReportContent';
import { downloadCSV } from './csv/download/csvDownload';
import { formatLicenseData } from '@/components/org-health/utils';
import { UserLicense } from '@/components/org-health/types';
import { supabase } from '@/integrations/supabase/client';

export const generateReportCSV = async (data: ExportData): Promise<string> => {
  // First, get the current license price from organization settings
  const instanceUrl = localStorage.getItem('sf_instance_url');
  const orgId = instanceUrl?.replace(/[^a-zA-Z0-9]/g, '_');
  
  let licensePrice = data.licensePrice;
  
  if (orgId) {
    const { data: settings } = await supabase
      .from('organization_settings')
      .select('license_cost_per_user')
      .eq('org_id', orgId)
      .maybeSingle();
    
    if (settings?.license_cost_per_user) {
      licensePrice = parseFloat(settings.license_cost_per_user.toString());
    }
  }

  console.log('CSV Export - Starting with initial data:', {
    userLicenses: data.userLicenses?.length,
    packageLicenses: data.packageLicenses?.length,
    users: data.users?.length,
    oauthTokens: data.oauthTokens?.length,
    licensePrice,
    sandboxes: data.sandboxes?.length,
    storageUsage: data.storageUsage
  });

  // Process users data
  const standardUsers = filterStandardSalesforceUsers(data.users || []);
  console.log('CSV Export - Filtered standard users:', standardUsers.length);
  const inactiveUsers = filterInactiveUsers(standardUsers);
  console.log('CSV Export - Filtered inactive users:', inactiveUsers.length);
  
  // Convert RawLicense[] to UserLicense[] first
  const userLicenses: UserLicense[] = data.userLicenses ? data.userLicenses.map(license => ({
    Id: license.Id,
    Name: license.Name || 'Unknown License',
    TotalLicenses: license.TotalLicenses || 0,
    UsedLicenses: license.UsedLicenses || 0
  })) : [];

  console.log('CSV Export - Converted user licenses:', userLicenses.length);

  // Then format them to match the License type expected by calculation functions
  const formattedUserLicenses = formatLicenseData(userLicenses);
  console.log('CSV Export - Formatted user licenses:', formattedUserLicenses.length);
  
  // Calculate savings using the same functions as the dashboard
  const inactiveUserSavings = calculateInactiveUserSavings(standardUsers, licensePrice);
  console.log('CSV Export - Inactive user savings calculation:', {
    count: inactiveUserSavings.count,
    savings: inactiveUserSavings.savings,
    licensePrice
  });

  const integrationUserSavings = calculateIntegrationUserSavings(
    standardUsers,
    data.oauthTokens || [],
    licensePrice,
    formattedUserLicenses
  );
  console.log('CSV Export - Integration user savings calculation:', {
    count: integrationUserSavings.count,
    savings: integrationUserSavings.savings
  });

  const sandboxSavingsCalc = calculateSandboxSavings(data.sandboxes || []);
  console.log('CSV Export - Sandbox savings calculation:', {
    count: sandboxSavingsCalc.count,
    savings: sandboxSavingsCalc.savings
  });

  const storageSavingsCalc = calculateStorageSavings(data.storageUsage || 0);
  console.log('CSV Export - Storage savings calculation:', {
    potentialGBSavings: storageSavingsCalc.potentialGBSavings,
    savings: storageSavingsCalc.savings
  });
  
  // Calculate platform license savings
  console.log('CSV Export - Calculating platform license savings with price:', licensePrice);
  const platformLicenseSavings = await calculatePlatformLicenseSavings(licensePrice);
  console.log('CSV Export - Platform license savings result:', platformLicenseSavings);

  // Calculate total savings
  const totalSavings = 
    inactiveUserSavings.savings +
    integrationUserSavings.savings +
    sandboxSavingsCalc.savings +
    storageSavingsCalc.savings +
    platformLicenseSavings.savings;

  const savingsBreakdown = {
    inactiveUserSavings,
    integrationUserSavings,
    platformLicenseSavings,
    sandboxSavings: sandboxSavingsCalc,
    storageSavings: storageSavingsCalc,
    totalSavings
  };

  console.log('CSV Export - Final savings breakdown:', savingsBreakdown);

  // Generate CSV content using the new generator
  const csvContent = generateSavingsReportContent({
    licensePrice,
    standardUsers,
    savingsBreakdown
  });

  // Get integration users and platform users
  const integrationUsers = standardUsers.filter(user => {
    const userTokens = (data.oauthTokens || []).filter(token => token.UserId === user.Id);
    return userTokens.length >= 2 && userTokens.some(token => token.UseCount > 1000);
  });

  const platformUsers = standardUsers.filter(user => user.isPlatformEligible);

  console.log('Creating user sections with:', {
    inactiveUsers: inactiveUsers.length,
    integrationUsers: integrationUsers.length,
    platformUsers: platformUsers.length
  });

  const sections = [
    createLicenseSection('User Licenses', data.userLicenses || []),
    createLicenseSection('Package Licenses', data.packageLicenses || []),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses || []),
    createSandboxSection(data.sandboxes || []),
    createLimitsSection(data.limits),
    createUserSection('Inactive Users', inactiveUsers),
    createUserSection('Integration User Candidates', integrationUsers),
    createUserSection('Platform License Candidates', platformUsers),
  ];

  sections.forEach(section => {
    if (section) {
      csvContent.push(
        [''],
        [section.title],
        section.headers,
        ...section.rows
      );
    }
  });

  return csvContent.map(row => row.join(',')).join('\n');
};

export { downloadCSV };
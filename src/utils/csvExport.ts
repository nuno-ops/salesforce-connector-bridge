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
  
  // Calculate platform license savings - now properly awaited
  console.log('CSV Export - Calculating platform license savings with price:', licensePrice);
  const platformLicenseSavings = await calculatePlatformLicenseSavings(licensePrice);
  console.log('CSV Export - Platform license savings result:', platformLicenseSavings);

  // Calculate total savings using the same formula as the dashboard
  const totalSavings = 
    inactiveUserSavings.savings +
    integrationUserSavings.savings +
    sandboxSavingsCalc.savings +
    storageSavingsCalc.savings +
    platformLicenseSavings.savings;

  console.log('CSV Export - Final savings breakdown:', {
    inactiveUserSavings: inactiveUserSavings.savings,
    integrationUserSavings: integrationUserSavings.savings,
    sandboxSavings: sandboxSavingsCalc.savings,
    storageSavings: storageSavingsCalc.savings,
    platformLicenseSavings: platformLicenseSavings.savings,
    totalSavings
  });

  const csvContent: string[][] = [
    ['Salesforce Organization Cost Optimization Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Cost Overview'],
    ['Current License Cost per User (Monthly):', `"$${licensePrice.toLocaleString('en-US')}"`],
    ['Total Users:', `${standardUsers.length}`],
    [''],
    ['Savings Summary'],
    ['Total Annual Potential Savings:', `"$${Math.round(totalSavings).toLocaleString('en-US')}"`],
    [''],
    ['Detailed Savings Breakdown'],
    ['Category', 'Annual Savings', 'Monthly Savings', 'Details'],
    [
      'Inactive User Licenses', 
      `"$${inactiveUserSavings.savings.toLocaleString('en-US')}"`,
      `"$${(inactiveUserSavings.savings / 12).toLocaleString('en-US')}"`,
      `${inactiveUserSavings.count} inactive users @ $${licensePrice}/month each`
    ],
    [
      'Integration User Optimization', 
      `"$${integrationUserSavings.savings.toLocaleString('en-US')}"`,
      `"$${(integrationUserSavings.savings / 12).toLocaleString('en-US')}"`,
      `${integrationUserSavings.count} users @ $${licensePrice}/month each`
    ],
    [
      'Platform License Optimization', 
      `"$${platformLicenseSavings.savings.toLocaleString('en-US')}"`,
      `"$${(platformLicenseSavings.savings / 12).toLocaleString('en-US')}"`,
      `${platformLicenseSavings.count} users @ $${licensePrice - 25}/month savings each`
    ],
    [
      'Sandbox Optimization', 
      `"$${sandboxSavingsCalc.savings.toLocaleString('en-US')}"`,
      `"$${(sandboxSavingsCalc.savings / 12).toLocaleString('en-US')}"`,
      `${sandboxSavingsCalc.count} excess sandboxes`
    ],
    [
      'Storage Optimization', 
      `"$${storageSavingsCalc.savings.toLocaleString('en-US')}"`,
      `"$${(storageSavingsCalc.savings / 12).toLocaleString('en-US')}"`,
      `${storageSavingsCalc.potentialGBSavings}GB potential reduction`
    ],
    [''],
    ['Percentage Breakdown'],
    ['Category', 'Percentage of Total Savings'],
    [
      'Inactive User Licenses',
      `${((inactiveUserSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Integration User Optimization',
      `${((integrationUserSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Platform License Optimization',
      `${((platformLicenseSavings.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Sandbox Optimization',
      `${((sandboxSavingsCalc.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    [
      'Storage Optimization',
      `${((storageSavingsCalc.savings / totalSavings) * 100).toFixed(1)}%`
    ],
    ['']
  ];

  console.log('Creating sandbox section with data:', data.sandboxes);
  console.log('Creating limits section with data:', data.limits);
  console.log('Creating Inactive Users section with', inactiveUsers.length, 'users');

  const sections = [
    createLicenseSection('User Licenses', data.userLicenses || []),
    createLicenseSection('Package Licenses', data.packageLicenses || []),
    createLicenseSection('Permission Set Licenses', data.permissionSetLicenses || []),
    createSandboxSection(data.sandboxes || []),
    createLimitsSection(data.limits),
    createUserSection('Inactive Users', inactiveUsers),
  ];

  sections.forEach(section => {
    if (section) {
      csvContent.push(
        [section.title],
        section.headers,
        ...section.rows,
        ['']
      );
    }
  });

  return csvContent.map(row => row.join(',')).join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
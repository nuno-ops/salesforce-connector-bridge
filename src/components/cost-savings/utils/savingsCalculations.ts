import { subDays } from 'date-fns';

interface User {
  Id: string;
  Username: string;
  LastLoginDate: string | null;
  UserType: string;
  Profile: {
    Name: string;
  };
}

interface OAuthToken {
  Id: string;
  AppName: string;
  LastUsedDate: string;
  UseCount: number;
  UserId: string;
}

interface License {
  name: string;
  total: number;
  used: number;
}

export const calculateInactiveUserSavings = (
  users: User[],
  licensePrice: number
): { savings: number; count: number } => {
  const thirtyDaysAgo = subDays(new Date(), 30);
  const inactiveUsers = users.filter(user => {
    if (!user.LastLoginDate) return true;
    return new Date(user.LastLoginDate) < thirtyDaysAgo;
  });

  return {
    savings: inactiveUsers.length * licensePrice * 12, // Annual savings
    count: inactiveUsers.length
  };
};

export const calculateIntegrationUserSavings = (
  users: User[],
  oauthTokens: OAuthToken[],
  licensePrice: number,
  userLicenses: License[] = []
): { savings: number; count: number } => {
  // Find Integration User license info
  const integrationLicense = userLicenses.find(license => 
    license.name.toLowerCase().includes('integration') || 
    license.name.toLowerCase().includes('api only')
  );

  // Calculate available integration user licenses
  const availableIntegrationLicenses = integrationLicense 
    ? integrationLicense.total - integrationLicense.used 
    : 0;

  // If no integration licenses available, return early
  if (availableIntegrationLicenses <= 0) {
    return { savings: 0, count: 0 };
  }

  // Group OAuth tokens by user
  const userOAuthUsage = new Map<string, OAuthToken[]>();
  oauthTokens.forEach(token => {
    const userTokens = userOAuthUsage.get(token.UserId) || [];
    userTokens.push(token);
    userOAuthUsage.set(token.UserId, userTokens);
  });

  // Find users who primarily use OAuth and could be converted
  const potentialIntegrationUsers = users.filter(user => {
    // Skip if user is already an integration user
    if (user.UserType === 'Integration User') return false;
    
    const userTokens = userOAuthUsage.get(user.Id) || [];
    // If user has multiple OAuth tokens with high usage
    return userTokens.length >= 2 && 
           userTokens.some(token => token.UseCount > 1000);
  });

  // Limit the number of suggested conversions to available licenses
  const recommendedCount = Math.min(
    potentialIntegrationUsers.length,
    availableIntegrationLicenses
  );

  return {
    savings: recommendedCount * licensePrice * 12, // Annual savings
    count: recommendedCount
  };
};

export const calculateSandboxSavings = (
  sandboxes: any[]
): { savings: number; count: number } => {
  const fullSandboxes = sandboxes.filter(sb => 
    sb.LicenseType.toLowerCase().includes('full')
  ).length;
  const excessFullSandboxes = Math.max(0, fullSandboxes - 1);
  
  return {
    savings: excessFullSandboxes * 5000 * 12, // $5000 per month per excess full sandbox
    count: excessFullSandboxes
  };
};

export const calculateStorageSavings = (
  storageUsage: number
): { savings: number; potentialGBSavings: number } => {
  if (storageUsage > 75) {
    const estimatedGBSavings = 2;
    return {
      savings: estimatedGBSavings * 250 * 12, // $250 per GB per month
      potentialGBSavings: estimatedGBSavings
    };
  }
  return { savings: 0, potentialGBSavings: 0 };
};
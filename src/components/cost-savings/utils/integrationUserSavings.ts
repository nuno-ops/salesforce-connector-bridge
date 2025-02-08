
import { User, OAuthToken, License } from './types';

export const calculateIntegrationUserSavings = (
  users: User[],
  oauthTokens: OAuthToken[],
  licensePrice: number,
  userLicenses: License[]
): { savings: number; count: number } => {
  console.log('[calculateIntegrationUserSavings] Starting calculation with:', {
    totalUsers: users.length,
    totalOAuthTokens: oauthTokens.length,
    licensePrice,
    timestamp: new Date().toISOString()
  });

  // Find Integration User license info
  const integrationLicense = userLicenses.find(license => 
    license.name === 'Salesforce Integration'
  );

  if (!integrationLicense) {
    console.log('[calculateIntegrationUserSavings] No Integration User License found');
    return { savings: 0, count: 0 };
  }

  // Calculate available integration user licenses
  const availableIntegrationLicenses = integrationLicense.total - integrationLicense.used;
  console.log('[calculateIntegrationUserSavings] License availability:', {
    total: integrationLicense.total,
    used: integrationLicense.used,
    available: availableIntegrationLicenses,
    timestamp: new Date().toISOString()
  });

  if (availableIntegrationLicenses <= 0) {
    console.log('[calculateIntegrationUserSavings] No available Integration User Licenses');
    return { savings: 0, count: 0 };
  }

  // Group OAuth tokens by user
  const userOAuthUsage = new Map<string, OAuthToken[]>();
  oauthTokens.forEach(token => {
    const userTokens = userOAuthUsage.get(token.UserId) || [];
    userTokens.push(token);
    userOAuthUsage.set(token.UserId, userTokens);
  });

  console.log('[calculateIntegrationUserSavings] OAuth usage mapping complete:', {
    uniqueUsersWithTokens: userOAuthUsage.size,
    timestamp: new Date().toISOString()
  });

  // Find users who primarily use OAuth and could be converted
  const potentialIntegrationUsers = users.filter(user => {
    if (user.UserType === 'Integration User') {
      console.log('[calculateIntegrationUserSavings] Skipping existing integration user:', user.Id);
      return false;
    }
    
    const userTokens = userOAuthUsage.get(user.Id) || [];
    const isEligible = userTokens.length >= 2 && 
           userTokens.some(token => token.UseCount > 1000);

    if (isEligible) {
      console.log('[calculateIntegrationUserSavings] Found eligible user:', {
        userId: user.Id,
        tokenCount: userTokens.length,
        highestUseCount: Math.max(...userTokens.map(t => t.UseCount)),
        timestamp: new Date().toISOString()
      });
    }

    return isEligible;
  });

  console.log('[calculateIntegrationUserSavings] Potential users found:', {
    count: potentialIntegrationUsers.length,
    timestamp: new Date().toISOString()
  });

  // Limit the number of suggested conversions to available licenses
  const recommendedCount = Math.min(
    potentialIntegrationUsers.length,
    availableIntegrationLicenses
  );

  console.log('[calculateIntegrationUserSavings] Final results:', {
    recommendedCount,
    annualSavings: recommendedCount * licensePrice * 12,
    timestamp: new Date().toISOString()
  });

  return {
    savings: recommendedCount * licensePrice * 12, // Annual savings
    count: recommendedCount
  };
};

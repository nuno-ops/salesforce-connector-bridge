import { User, OAuthToken, License } from './types';

export const calculateIntegrationUserSavings = (
  users: User[],
  oauthTokens: OAuthToken[],
  licensePrice: number,
  userLicenses: License[]
): { savings: number; count: number } => {
  // Find Integration User license info
  const integrationLicense = userLicenses.find(license => 
    license.name === 'Salesforce Integration'
  );

  if (!integrationLicense) {
    console.log('No Integration User License found');
    return { savings: 0, count: 0 };
  }

  // Calculate available integration user licenses
  const availableIntegrationLicenses = integrationLicense.total - integrationLicense.used;
  console.log('Available Integration Licenses:', availableIntegrationLicenses);

  if (availableIntegrationLicenses <= 0) {
    console.log('No available Integration User Licenses');
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

  console.log('Potential Integration Users found:', potentialIntegrationUsers.length);

  // Limit the number of suggested conversions to available licenses
  const recommendedCount = Math.min(
    potentialIntegrationUsers.length,
    availableIntegrationLicenses
  );

  console.log('Recommended conversions after license availability check:', recommendedCount);

  return {
    savings: recommendedCount * licensePrice * 12, // Annual savings
    count: recommendedCount
  };
};
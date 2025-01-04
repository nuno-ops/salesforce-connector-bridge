import { User, OAuthToken, License } from '../utils/types';

interface IntegrationSavingsResult {
  savings: number;
  count: number;
  users: User[];
}

export const useIntegrationUserSavings = (
  users: User[],
  oauthTokens: OAuthToken[],
  licensePrice: number,
  userLicenses: License[]
): IntegrationSavingsResult => {
  // Find Integration User license info
  const integrationLicense = userLicenses.find(license => 
    license.name === 'Salesforce Integration'
  );

  if (!integrationLicense) {
    console.log('No Integration User License found');
    return { savings: 0, count: 0, users: [] };
  }

  // Calculate available integration user licenses
  const availableIntegrationLicenses = integrationLicense.total - integrationLicense.used;
  console.log('Available Integration Licenses:', availableIntegrationLicenses);

  if (availableIntegrationLicenses <= 0) {
    console.log('No available Integration User Licenses');
    return { savings: 0, count: 0, users: [] };
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
    if (user.UserType === 'Integration User') return false;
    
    const userTokens = userOAuthUsage.get(user.Id) || [];
    return userTokens.length >= 2 && 
           userTokens.some(token => token.UseCount > 1000);
  });

  console.log('Potential Integration Users found:', potentialIntegrationUsers.length);

  // Limit the number of suggested conversions to available licenses
  const recommendedCount = Math.min(
    potentialIntegrationUsers.length,
    availableIntegrationLicenses
  );

  return {
    savings: recommendedCount * licensePrice * 12,
    count: recommendedCount,
    users: potentialIntegrationUsers.slice(0, recommendedCount)
  };
};

import { User, OAuthToken } from './types';

export const calculateIntegrationUserSavings = (
  users: User[],
  oauthTokens: OAuthToken[],
  licensePrice: number
): { savings: number; count: number } => {
  console.log('[calculateIntegrationUserSavings] Starting calculation with:', {
    totalUsers: users.length,
    totalOAuthTokens: oauthTokens.length,
    licensePrice,
    timestamp: new Date().toISOString()
  });

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

  // Calculate savings based on license price
  const annualSavings = potentialIntegrationUsers.length * licensePrice * 12;

  console.log('[calculateIntegrationUserSavings] Final results:', {
    recommendedCount: potentialIntegrationUsers.length,
    annualSavings,
    timestamp: new Date().toISOString()
  });

  return {
    savings: annualSavings,
    count: potentialIntegrationUsers.length
  };
};

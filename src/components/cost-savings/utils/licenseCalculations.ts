import { subDays } from 'date-fns';

interface SalesforceUser {
  Id: string;
  Username: string;
  LastLoginDate: string;
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

export const calculateInactiveUsers = (users: SalesforceUser[]) => {
  const thirtyDaysAgo = subDays(new Date(), 30);
  return users.filter(user => {
    if (!user.LastLoginDate) return true;
    return new Date(user.LastLoginDate) < thirtyDaysAgo;
  });
};

export const analyzeIntegrationOpportunities = (
  users: SalesforceUser[],
  oauthTokens: OAuthToken[],
  inactiveUsers: SalesforceUser[]
) => {
  // Group OAuth tokens by user
  const userOAuthUsage = new Map<string, OAuthToken[]>();
  oauthTokens.forEach(token => {
    const userTokens = userOAuthUsage.get(token.UserId) || [];
    userTokens.push(token);
    userOAuthUsage.set(token.UserId, userTokens);
  });

  // Find users who primarily use OAuth and could be converted to integration users
  const potentialIntegrationUsers = users.filter(user => {
    // Skip if user is already inactive
    if (inactiveUsers.some(inactive => inactive.Id === user.Id)) return false;
    
    // Skip if user is already an integration user
    if (user.UserType === 'Integration User') return false;

    const userTokens = userOAuthUsage.get(user.Id) || [];
    // If user has multiple OAuth tokens with high usage
    return userTokens.length >= 2 && 
           userTokens.some(token => token.UseCount > 1000);
  });

  return potentialIntegrationUsers;
};

export const calculateTotalSavings = (
  inactiveUsers: SalesforceUser[],
  potentialIntegrationUsers: SalesforceUser[],
  licensePrice: number
) => {
  const totalInactiveLicenses = inactiveUsers.length;
  const potentialIntegrationLicenses = potentialIntegrationUsers.length;
  
  // Calculate annual savings
  const inactiveLicenseSavings = totalInactiveLicenses * licensePrice * 12;
  const integrationLicenseSavings = potentialIntegrationLicenses * licensePrice * 12;

  return {
    inactiveLicenseSavings,
    integrationLicenseSavings,
    totalSavings: inactiveLicenseSavings + integrationLicenseSavings,
    details: {
      inactiveCount: totalInactiveLicenses,
      integrationCount: potentialIntegrationLicenses
    }
  };
};
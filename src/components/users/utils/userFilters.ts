import { format } from 'date-fns';

export interface SalesforceUser {
  Id: string;
  Username: string;
  LastLoginDate: string;
  UserType: string;
  Profile: {
    Name: string;
    UserLicense?: {
      LicenseDefinitionKey?: string;
      Name?: string;
    };
  };
  isPlatformEligible?: boolean;
  connectedApps?: string[];
}

export const filterStandardSalesforceUsers = (users: SalesforceUser[]) => {
  return users.filter(user => 
    user.UserType === 'Standard' && 
    user.Profile?.UserLicense?.Name === 'Salesforce'
  );
};

export const filterInactiveUsers = (users: SalesforceUser[]) => {
  return users.filter(user => {
    const lastLogin = user.LastLoginDate ? new Date(user.LastLoginDate) : null;
    return !lastLogin || (Date.now() - lastLogin.getTime()) > 30 * 24 * 60 * 60 * 1000;
  });
};

export const formatLastLoginDate = (date: string | null) => {
  return date ? format(new Date(date), 'PPp') : 'Never';
};

export const maskUsername = (username: string) => {
  if (username.length <= 4) return username;
  return username.slice(0, 4) + '*'.repeat(username.length - 4);
};
import { subDays } from 'date-fns';
import { User } from './types';

interface InactiveUserResult {
  savings: number;
  count: number;
  users: User[];
}

export const calculateInactiveUserSavings = (
  users: User[],
  licensePrice: number
): InactiveUserResult => {
  console.log('Calculating inactive user savings with license price:', licensePrice);
  
  const thirtyDaysAgo = subDays(new Date(), 30);
  const inactiveUsers = users.filter(user => {
    if (!user.LastLoginDate) return true;
    return new Date(user.LastLoginDate) < thirtyDaysAgo;
  });

  const annualSavings = inactiveUsers.length * licensePrice * 12; // Using actual license price
  
  console.log('Inactive users calculation:', {
    inactiveCount: inactiveUsers.length,
    licensePrice,
    annualSavings
  });

  return {
    savings: annualSavings,
    count: inactiveUsers.length,
    users: inactiveUsers
  };
};
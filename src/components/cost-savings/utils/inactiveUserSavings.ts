import { subDays } from 'date-fns';
import { User } from './types';

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
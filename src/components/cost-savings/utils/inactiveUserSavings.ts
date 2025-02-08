
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
  console.log('[calculateInactiveUserSavings] Starting calculation with:', {
    totalUsers: users.length,
    licensePrice,
    timestamp: new Date().toISOString()
  });
  
  const thirtyDaysAgo = subDays(new Date(), 30);
  const inactiveUsers = users.filter(user => {
    const isInactive = !user.LastLoginDate || new Date(user.LastLoginDate) < thirtyDaysAgo;
    if (isInactive) {
      console.log('[calculateInactiveUserSavings] Found inactive user:', {
        id: user.Id,
        lastLogin: user.LastLoginDate,
        timestamp: new Date().toISOString()
      });
    }
    return isInactive;
  });

  const annualSavings = inactiveUsers.length * licensePrice * 12;
  
  console.log('[calculateInactiveUserSavings] Calculation results:', {
    inactiveCount: inactiveUsers.length,
    licensePrice,
    annualSavings,
    timestamp: new Date().toISOString()
  });

  return {
    savings: annualSavings,
    count: inactiveUsers.length,
    users: inactiveUsers
  };
};

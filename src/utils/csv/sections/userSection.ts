import { SalesforceUser } from '@/components/users/utils/userFilters';
import { CSVSection } from '../types';

export const createUserSection = (title: string, users: SalesforceUser[]): CSVSection => {
  console.log(`Creating ${title} section with ${users.length} users:`, users);
  
  const rows = users.map(user => {
    const row = [
      user.Username || 'Unknown',
      user.LastLoginDate || 'Never',
      user.UserType || 'Unknown',
      user.Profile?.Name || 'N/A',
      Array.isArray(user.connectedApps) ? user.connectedApps.join(', ') : 'N/A'
    ];

    console.log('Processing user row:', {
      username: user.Username,
      lastLogin: user.LastLoginDate,
      userType: user.UserType,
      profile: user.Profile?.Name,
      connectedApps: user.connectedApps
    });

    return row;
  });

  return {
    title,
    headers: ['Username', 'Last Login', 'User Type', 'Profile', 'Connected Apps'],
    rows
  };
};
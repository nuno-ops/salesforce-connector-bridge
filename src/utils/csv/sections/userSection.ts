import { SalesforceUser } from '@/components/users/utils/userFilters';
import { formatLastLoginDate } from '@/components/users/utils/userFilters';

export const createUserSection = (title: string, users: SalesforceUser[]) => {
  console.log(`Creating ${title} section with ${users.length} users`);
  
  return {
    title,
    headers: ['Username', 'Last Login', 'User Type', 'Profile', 'Connected Apps'],
    rows: users.map(user => [
      user.Username || 'Unknown',
      formatLastLoginDate(user.LastLoginDate),
      user.UserType || 'Unknown',
      user.Profile?.Name || 'N/A',
      user.connectedApps?.join(', ') || 'N/A'
    ])
  };
};
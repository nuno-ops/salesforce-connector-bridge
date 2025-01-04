export const createUserSection = (title: string, users: any[]) => {
  console.log(`Creating ${title} section with ${users.length} users`);
  
  return {
    title,
    headers: ['Username', 'Last Login', 'User Type', 'Profile'],
    rows: users.map(user => [
      user.Username || 'Unknown',
      user.LastLoginDate || 'Never',
      user.UserType || 'Unknown',
      user.Profile?.Name || 'N/A'
    ])
  };
};
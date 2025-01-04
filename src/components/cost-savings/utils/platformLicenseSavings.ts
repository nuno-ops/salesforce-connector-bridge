interface PlatformUser {
  isPlatformEligible: boolean;
  Profile?: {
    UserLicense?: {
      Name: string;
    };
  };
  UserType?: string;
}

interface PlatformSavingsResult {
  savings: number;
  count: number;
  users: PlatformUser[];
}

export const calculatePlatformLicenseSavings = async (licensePrice: number): Promise<PlatformSavingsResult> => {
  try {
    // Simulate API call or calculation
    const mockUsers = [
      {
        isPlatformEligible: true,
        Profile: { UserLicense: { Name: 'Salesforce' } },
        UserType: 'Standard'
      }
    ];

    return {
      savings: 0,
      count: mockUsers.length,
      users: mockUsers
    };
  } catch (error) {
    console.error('Error in calculatePlatformLicenseSavings:', error);
    return {
      savings: 0,
      count: 0,
      users: []
    };
  }
};
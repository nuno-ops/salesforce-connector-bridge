export const calculateStorageSavings = (
  storageUsage: number
): { savings: number; potentialGBSavings: number } => {
  if (storageUsage > 75) {
    const estimatedGBSavings = 2;
    return {
      savings: estimatedGBSavings * 250 * 12, // $250 per GB per month
      potentialGBSavings: estimatedGBSavings
    };
  }
  return { savings: 0, potentialGBSavings: 0 };
};
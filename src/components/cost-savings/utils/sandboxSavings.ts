export const calculateSandboxSavings = (
  sandboxes: any[]
): { savings: number; count: number } => {
  const fullSandboxes = sandboxes.filter(sb => 
    sb.LicenseType.toLowerCase().includes('full')
  ).length;
  const excessFullSandboxes = Math.max(0, fullSandboxes - 1);
  
  return {
    savings: excessFullSandboxes * 5000 * 12, // $5000 per month per excess full sandbox
    count: excessFullSandboxes
  };
};
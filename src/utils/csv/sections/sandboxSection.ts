export const createSandboxSection = (sandboxes: any[]) => {
  console.log('Creating sandbox section with data:', sandboxes);
  
  return {
    title: 'Sandboxes',
    headers: ['Name', 'Type', 'Status'],
    rows: sandboxes.map(sandbox => [
      sandbox.SandboxName || 'Unknown',
      sandbox.LicenseType || 'Unknown',
      sandbox.Status || 'Active'
    ])
  };
};
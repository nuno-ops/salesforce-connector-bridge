export const formatLicenseData = (licenses: any[]) => {
  console.log('Formatting user licenses:', licenses);
  
  return licenses.map(license => {
    console.log('Processing license:', license);
    
    const result = {
      name: license.Name || 'Unknown',
      total: license.TotalLicenses,
      used: license.UsedLicenses
    };
    
    console.log('Formatted license:', result);
    return result;
  });
};

export const formatPackageLicenseData = (licenses: any[]) => {
  console.log('Formatting package licenses:', licenses);
  
  return licenses.map(license => {
    console.log('Processing package license:', license);
    
    const result = {
      name: license.NamespacePrefix || 'Unknown',
      total: license.AllowedLicenses || 0,
      used: license.UsedLicenses || 0
    };
    
    console.log('Formatted package license:', result);
    return result;
  });
};

export const formatPermissionSetLicenseData = (licenses: any[]) => {
  console.log('Formatting permission set licenses:', licenses);
  
  return licenses.map(license => {
    console.log('Processing permission set license:', license);
    
    // Use DeveloperName for permission set licenses
    const result = {
      name: license.DeveloperName || 'Unknown',
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      // Add any additional metadata that might be useful
      id: license.Id,
      type: 'permissionSet'
    };
    
    console.log('Formatted permission set license:', result);
    return result;
  });
};
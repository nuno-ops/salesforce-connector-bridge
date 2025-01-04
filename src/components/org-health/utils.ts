export const formatLicenseData = (licenses: any[]) => {
  console.log('Formatting user licenses:', licenses);
  
  return licenses.map(license => {
    console.log('Processing user license:', license);
    
    const result = {
      name: license.Name || 'Unknown',
      total: license.TotalLicenses,
      used: license.UsedLicenses
    };
    
    console.log('Formatted user license:', result);
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
  console.log('Formatting permission set licenses. Raw input:', JSON.stringify(licenses, null, 2));
  
  return licenses.map(license => {
    console.log('Processing permission set license. Raw input:', JSON.stringify(license, null, 2));
    
    const result = {
      name: license.DeveloperName || 'Unknown',
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      id: license.Id,
      type: 'permissionSet'
    };
    
    console.log('Formatted permission set license result:', JSON.stringify(result, null, 2));
    return result;
  });
};
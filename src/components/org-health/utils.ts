export const formatLicenseData = (licenses: any[]) => {
  console.log('Formatting user licenses. Raw input:', JSON.stringify(licenses, null, 2));
  
  return licenses.map(license => {
    console.log('Processing user license:', JSON.stringify(license, null, 2));
    
    const result = {
      name: license.Name || license.DeveloperName || 'Unknown',
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      id: license.Id,
      type: 'user'
    };
    
    console.log('Formatted user license result:', JSON.stringify(result, null, 2));
    return result;
  });
};

export const formatPackageLicenseData = (licenses: any[]) => {
  console.log('Formatting package licenses:', JSON.stringify(licenses, null, 2));
  
  return licenses.map(license => {
    console.log('Processing package license:', JSON.stringify(license, null, 2));
    
    const result = {
      name: license.NamespacePrefix || 'Unknown',
      total: license.AllowedLicenses || 0,
      used: license.UsedLicenses || 0,
      id: license.Id,
      type: 'package'
    };
    
    console.log('Formatted package license:', JSON.stringify(result, null, 2));
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
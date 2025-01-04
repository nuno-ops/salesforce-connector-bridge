export const formatLicenseData = (licenses: any[]) => {
  console.log('Formatting user licenses. Raw input:', licenses);
  
  return licenses.map(license => {
    console.log('Processing user license:', license);
    
    const formatted = {
      name: license.Name || 'Unknown',
      total: license.TotalLicenses || 0,
      used: license.UsedLicenses || 0,
      id: license.Id,
      type: 'user'
    };
    
    console.log('Formatted user license:', formatted);
    return formatted;
  });
};

export const formatPackageLicenseData = (licenses: any[]) => {
  console.log('Formatting package licenses:', licenses);
  
  return licenses.map(license => {
    console.log('Processing package license:', license);
    
    const formatted = {
      name: license.NamespacePrefix || 'Unknown',
      total: license.AllowedLicenses === -1 ? Infinity : (license.AllowedLicenses || 0),
      used: license.UsedLicenses || 0,
      status: license.Status || 'Unknown',
      id: license.Id,
      type: 'package'
    };
    
    console.log('Formatted package license:', formatted);
    return formatted;
  });
};

export const formatPermissionSetLicenseData = (licenses: any[]) => {
  console.log('Formatting permission set licenses:', licenses);
  
  return licenses.map(license => {
    console.log('Processing permission set license:', license);
    
    const formatted = {
      name: license.DeveloperName || 'Unknown',
      total: license.TotalLicenses || 0,
      used: license.UsedLicenses || 0,
      id: license.Id,
      type: 'permissionSet'
    };
    
    console.log('Formatted permission set license:', formatted);
    return formatted;
  });
};
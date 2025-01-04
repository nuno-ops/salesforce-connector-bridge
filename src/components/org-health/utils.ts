export const formatLicenseData = (licenses: any[]) => {
  console.log('formatLicenseData - Input:', JSON.stringify(licenses, null, 2));
  
  const formatted = licenses.map(license => {
    console.log('formatLicenseData - Processing license:', {
      raw: license,
      name: license.Name,
      total: license.TotalLicenses,
      used: license.UsedLicenses
    });
    
    const result = {
      ...license,
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      name: license.Name || 'Unknown'
    };
    
    console.log('formatLicenseData - Formatted result:', result);
    return result;
  });

  console.log('formatLicenseData - Final output:', JSON.stringify(formatted, null, 2));
  return formatted;
};

export const formatPackageLicenseData = (licenses: any[]) => {
  console.log('formatPackageLicenseData - Input:', JSON.stringify(licenses, null, 2));
  
  const formatted = licenses.map(license => {
    console.log('formatPackageLicenseData - Processing license:', {
      raw: license,
      name: license.NamespacePrefix,
      total: license.AllowedLicenses,
      used: license.UsedLicenses
    });
    
    const result = {
      ...license,
      total: license.AllowedLicenses,
      used: license.UsedLicenses,
      name: license.NamespacePrefix || 'Unknown'
    };
    
    console.log('formatPackageLicenseData - Formatted result:', result);
    return result;
  });

  console.log('formatPackageLicenseData - Final output:', JSON.stringify(formatted, null, 2));
  return formatted;
};

export const formatPermissionSetLicenseData = (licenses: any[]) => {
  console.log('formatPermissionSetLicenseData - Input:', JSON.stringify(licenses, null, 2));
  
  const formatted = licenses.map(license => {
    console.log('formatPermissionSetLicenseData - Processing license:', {
      raw: license,
      name: license.DeveloperName,
      total: license.TotalLicenses,
      used: license.UsedLicenses
    });
    
    const result = {
      ...license,
      total: license.TotalLicenses,
      used: license.UsedLicenses,
      name: license.DeveloperName || 'Unknown'
    };
    
    console.log('formatPermissionSetLicenseData - Formatted result:', result);
    return result;
  });

  console.log('formatPermissionSetLicenseData - Final output:', JSON.stringify(formatted, null, 2));
  return formatted;
};
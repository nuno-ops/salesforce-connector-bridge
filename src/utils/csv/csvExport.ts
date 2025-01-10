import { generateSavingsReportContent } from './generators/savingsReportContent';
import { formatCurrency, formatPercentage } from '../formatters';
import { SavingsReportData } from '../types';

export const generateCSVContent = async (data: any) => {
  console.log('CSV Export - Starting generation with data:', {
    hasUsers: !!data.users?.length,
    hasLicenses: !!data.userLicenses?.length,
    hasSavingsBreakdown: !!data.savingsBreakdown?.length,
    licensePrice: data.licensePrice,
    timestamp: new Date().toISOString()
  });

  const content = {
    savings: await generateSavingsReportContent(data),
    users: data.users?.map(user => ({
      Id: user.Id,
      Username: user.Username,
      LastLoginDate: user.LastLoginDate,
      UserType: user.UserType,
      ProfileName: user.Profile?.Name,
    })) || [],
    licenses: data.userLicenses?.map(license => ({
      Id: license.Id,
      Name: license.Name,
      LicenseDefinitionKey: license.LicenseDefinitionKey,
    })) || [],
    oauthTokens: data.oauthTokens?.map(token => ({
      Id: token.Id,
      AppName: token.AppName,
      LastUsedDate: token.LastUsedDate,
      UseCount: token.UseCount,
    })) || [],
  };

  console.log('CSV Export - Generated content structure:', {
    sections: Object.keys(content),
    savingsContentRows: content.savings?.length,
    usersContentRows: content.users?.length,
    licensesContentRows: content.licenses?.length,
    oauthTokensContentRows: content.oauthTokens?.length,
    timestamp: new Date().toISOString()
  });

  return content;
};

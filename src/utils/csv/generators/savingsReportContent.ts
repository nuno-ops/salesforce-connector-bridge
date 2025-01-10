import { formatCurrency, formatPercentage } from '../formatters';
import { SavingsReportData } from '../types';

export const generateSavingsReportContent = (data: SavingsReportData) => {
  console.log('Savings Report Generator - Input data:', {
    standardUsers: data.standardUsers?.length,
    licensePrice: data.licensePrice,
    inactiveUserSavings: data.inactiveUserSavings,
    integrationUserSavings: data.integrationUserSavings,
    platformLicenseSavings: data.platformLicenseSavings,
    timestamp: new Date().toISOString()
  });

  const totalUsers = data.standardUsers?.length || 0;
  const monthlyLicenseCost = data.licensePrice || 0;
  const totalMonthlyCost = totalUsers * monthlyLicenseCost;
  const totalAnnualCost = totalMonthlyCost * 12;

  console.log('Savings Report Generator - Cost calculations:', {
    totalUsers,
    monthlyLicenseCost,
    totalMonthlyCost,
    totalAnnualCost,
    timestamp: new Date().toISOString()
  });

  // Calculate total savings
  const totalAnnualSavings = (data.inactiveUserSavings || 0) +
                            (data.integrationUserSavings || 0) +
                            (data.platformLicenseSavings || 0) +
                            (data.sandboxSavings || 0) +
                            (data.storageSavings || 0);
  
  console.log('Savings Report Generator - Savings calculations:', {
    inactiveUserSavings: data.inactiveUserSavings,
    integrationUserSavings: data.integrationUserSavings,
    platformLicenseSavings: data.platformLicenseSavings,
    sandboxSavings: data.sandboxSavings,
    storageSavings: data.storageSavings,
    totalAnnualSavings,
    timestamp: new Date().toISOString()
  });

  return {
    header: [
      'User Count',
      'Monthly License Cost',
      'Total Monthly Cost',
      'Total Annual Cost',
      'Total Annual Savings'
    ],
    rows: [
      [
        totalUsers,
        formatCurrency(monthlyLicenseCost),
        formatCurrency(totalMonthlyCost),
        formatCurrency(totalAnnualCost),
        formatCurrency(totalAnnualSavings)
      ]
    ]
  };
};
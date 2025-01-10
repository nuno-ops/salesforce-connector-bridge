import { formatCurrency, formatPercentage } from '../formatters';
import { SavingsReportData } from '../types';

export const generateSavingsReportContent = (data: SavingsReportData) => {
  console.log('Savings Report Generator - Input data:', {
    userCount: data.users?.length,
    licensePrice: data.licensePrice,
    savingsBreakdown: data.savingsBreakdown,
    inactiveUsers: data.inactiveUsers?.length,
    integrationUsers: data.integrationUsers?.length,
    platformUsers: data.platformUsers?.length,
    timestamp: new Date().toISOString()
  });

  const totalUsers = data.users?.length || 0;
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

  // Calculate total savings from breakdown
  const totalAnnualSavings = (data.savingsBreakdown || []).reduce((total, item) => total + (item.amount || 0), 0) * 12;
  
  console.log('Savings Report Generator - Savings calculations:', {
    savingsBreakdownItems: data.savingsBreakdown?.map(item => ({
      title: item.title,
      monthlyAmount: item.amount,
      annualAmount: item.amount * 12
    })),
    totalAnnualSavings,
    timestamp: new Date().toISOString()
  });

  return {
    header: [
      'User Count',
      'Monthly License Cost',
      'Total Monthly Cost',
      'Total Annual Cost',
      'Total Annual Savings',
      'Savings Breakdown'
    ],
    rows: [
      [
        totalUsers,
        formatCurrency(monthlyLicenseCost),
        formatCurrency(totalMonthlyCost),
        formatCurrency(totalAnnualCost),
        formatCurrency(totalAnnualSavings),
        data.savingsBreakdown?.map(item => `${item.title}: ${formatCurrency(item.amount)}`).join(', ')
      ]
    ]
  };
};
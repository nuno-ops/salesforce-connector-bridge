export const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString()}`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
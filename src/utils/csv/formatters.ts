export const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString()}`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (value: number | undefined | null): number => {
  if (value === undefined || value === null) {
    return 0;
  }
  return value === -1 ? 0 : Number(value) || 0;
};
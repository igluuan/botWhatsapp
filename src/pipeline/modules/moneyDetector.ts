export const hasMoneyValue = (text: string): boolean => {
  return /\d+([.,]\d{1,2})?/.test(text);
};

/**
 * Format a price value as LKR currency string.
 * @param {number} price
 * @returns {string}  e.g. "LKR 6,800"
 */
export function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return 'LKR 0';
  return `LKR ${Number(price).toLocaleString()}`;
}

export default formatPrice;
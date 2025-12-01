/**
 * Format price in Nigerian Naira
 */
export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format price without currency symbol (just the number)
 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}


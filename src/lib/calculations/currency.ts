/**
 * Currency utilities for Indian Rupee (INR).
 * All monetary amounts in the database and internal calculations are stored in integer paise
 * (1 INR = 100 paise) to prevent floating point inaccuracies.
 */

/**
 * Converts a rupee value (number or string representation) to integer paise.
 * Rounds to nearest integer to avoid float representation artifacts.
 */
export function rupeesToPaise(amountInRupees: number | string): number {
  const num = typeof amountInRupees === "string" ? parseFloat(amountInRupees) : amountInRupees;
  if (isNaN(num)) {
    throw new Error(`Invalid rupee amount: ${amountInRupees}`);
  }
  return Math.round(num * 100);
}

/**
 * Converts integer paise to a float rupee value.
 */
export function paiseToRupees(paise: number): number {
  if (!Number.isInteger(paise)) {
    throw new Error(`Paise must be an integer, received: ${paise}`);
  }
  return paise / 100;
}

/**
 * Formats integer paise into a standard INR string representation (e.g. "₹1,23,456.50").
 */
export function formatINR(paise: number, options?: { showSign?: boolean; showZeroAsFree?: boolean }): string {
  if (options?.showZeroAsFree && paise === 0) {
    return "₹0.00";
  }

  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = absPaise / 100;

  // Format with standard Indian numbering grouping: 1,23,456.78
  const formattedNumber = rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sign = isNegative ? "-₹" : options?.showSign && paise > 0 ? "+₹" : "₹";
  return `${sign}${formattedNumber}`;
}

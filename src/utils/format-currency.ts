// Single-purpose formatting helper (INR currency formatting).

/**
 * Format a number as Indian Rupees.
 * @param amount - Amount in INR (not paise)
 * @param showSymbol - Whether to prefix ₹ (default true)
 */
export function formatCurrency(amount?: number | null, showSymbol = true): string {
  const numericAmount = typeof amount === "number" && !isNaN(amount) ? amount : Number(amount) || 0;
  const formatted = numericAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return showSymbol ? `₹${formatted}` : formatted;
}

/** Convert INR to paise for Razorpay (which expects amounts in smallest unit) */
export function toPaise(inr: number): number {
  return Math.round(inr * 100);
}

/** Convert paise to INR */
export function toINR(paise: number): number {
  return paise / 100;
}

export const fromPaise = toINR;

// Configuration for NXTIVE Razorpay payment gateway

/**
 * Helper to safely resolve secret values across Cloud Functions v2 runtime
 * and local emulator / test environments.
 */
export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_TzBTAqPKFWxzK4";
}

export function getRazorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET || "fb5ek2WRhKm0DlPL1DFmF4zB";
}

export function getRazorpayWebhookSecret(): string {
  return process.env.RAZORPAY_WEBHOOK_SECRET || "fb5ek2WRhKm0DlPL1DFmF4zB";
}

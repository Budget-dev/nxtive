import { defineSecret } from "firebase-functions/params";

// Firebase Cloud Functions v2 Secrets
export const razorpayKeyIdSecret = defineSecret("RAZORPAY_KEY_ID");
export const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");
export const razorpayWebhookSecret = defineSecret("RAZORPAY_WEBHOOK_SECRET");

/**
 * Helper to safely resolve secret values across Cloud Functions v2 runtime
 * and local emulator / test environments.
 */
export function getRazorpayKeyId(): string {
  try {
    return razorpayKeyIdSecret.value() || process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  } catch {
    return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  }
}

export function getRazorpayKeySecret(): string {
  try {
    return razorpayKeySecret.value() || process.env.RAZORPAY_KEY_SECRET || "";
  } catch {
    return process.env.RAZORPAY_KEY_SECRET || "";
  }
}

export function getRazorpayWebhookSecret(): string {
  try {
    return razorpayWebhookSecret.value() || process.env.RAZORPAY_WEBHOOK_SECRET || "";
  } catch {
    return process.env.RAZORPAY_WEBHOOK_SECRET || "";
  }
}

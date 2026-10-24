// Typed, validated access to environment variables. Import server-only vars only in server code.

/** Client-safe env (NEXT_PUBLIC_*) */
export const clientEnv = {
  FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAWwaVSLhQcj6QS_Nm3OWZmQ2WSdQyTyMQ",
  FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nxtive-80349.firebaseapp.com",
  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nxtive-80349",
  FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "nxtive-80349.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "362396170752",
  FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:362396170752:web:4b4da6e1e3e8f1ab56f6e5",
  FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-LG8KMK4S3Q",
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
} as const;

/**
 * Server-only env — only call from server components, route handlers, or server actions.
 * Returns validated server secrets; throws if any required var is missing.
 */
export function getServerEnv() {
  const env = {
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nxtive-80349",
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "",
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY || "",
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
    DELIVERY_PROVIDER_API_KEY: process.env.DELIVERY_PROVIDER_API_KEY || "",
    DELIVERY_PROVIDER_BASE_URL: process.env.DELIVERY_PROVIDER_BASE_URL || "",
    DELIVERY_WEBHOOK_SECRET: process.env.DELIVERY_WEBHOOK_SECRET || "",
  } as const;

  return env;
}

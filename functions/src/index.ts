import { initializeApp, getApps } from "firebase-admin/app";

// Ensure Firebase Admin SDK is initialized
if (getApps().length === 0) {
  initializeApp();
}

// Export Cloud Functions
export { createRazorpayOrder } from "./createOrder";
export { verifyRazorpayPayment } from "./verifyPayment";
export { razorpayWebhook } from "./webhook";
export { reconcileStuckOrders } from "./reconcile";

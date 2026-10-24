import crypto from "crypto";
import Razorpay from "razorpay";
import { getRazorpayKeyId, getRazorpayKeySecret, getRazorpayWebhookSecret } from "./config";

let razorpayClient: InstanceType<typeof Razorpay> | null = null;

export function getRazorpay(): InstanceType<typeof Razorpay> {
  const key_id = getRazorpayKeyId();
  const key_secret = getRazorpayKeySecret();

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured.");
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({ key_id, key_secret });
  }
  return razorpayClient;
}

/**
 * Verifies Razorpay payment signature from client checkout callback:
 * HMAC_SHA256(order_id + "|" + payment_id, key_secret) === signature
 * Uses timing-safe string comparison to prevent timing attacks.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = getRazorpayKeySecret();
  if (!secret) return false;

  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, received);
}

/**
 * Verifies Razorpay webhook signature:
 * HMAC_SHA256(raw_request_body, webhook_secret) === x-razorpay-signature
 * Uses timing-safe string comparison.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string
): boolean {
  const secret = getRazorpayWebhookSecret();
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, received);
}

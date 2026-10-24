import { describe, it, expect } from "vitest";
import crypto from "crypto";

// Standalone implementation of HMAC SHA256 signature verification matching functions/src/razorpay.ts
function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
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

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  if (!webhookSecret) return false;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, received);
}

describe("Razorpay Signature Verification", () => {
  const secret = "test_key_secret_xyz123";
  const webhookSecret = "test_webhook_secret_abc789";

  it("verifies genuine payment signature generated with correct key_secret", () => {
    const orderId = "order_O4uF83jDq72kLa";
    const paymentId = "pay_P89kL301jKlMN8";
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid = verifyPaymentSignature(orderId, paymentId, validSignature, secret);
    expect(isValid).toBe(true);
  });

  it("rejects forged or tampered payment signature", () => {
    const orderId = "order_O4uF83jDq72kLa";
    const paymentId = "pay_P89kL301jKlMN8";
    const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const isValid = verifyPaymentSignature(orderId, paymentId, forgedSignature, secret);
    expect(isValid).toBe(false);
  });

  it("rejects signature signed with wrong key secret", () => {
    const orderId = "order_O4uF83jDq72kLa";
    const paymentId = "pay_P89kL301jKlMN8";
    const wrongSignature = crypto
      .createHmac("sha256", "wrong_secret")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid = verifyPaymentSignature(orderId, paymentId, wrongSignature, secret);
    expect(isValid).toBe(false);
  });

  it("verifies genuine Razorpay webhook signature", () => {
    const webhookPayload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_123", amount: 129900 } } },
    });
    const validWebhookSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex");

    const isValid = verifyWebhookSignature(webhookPayload, validWebhookSig, webhookSecret);
    expect(isValid).toBe(true);
  });

  it("rejects tampered webhook body or signature mismatch", () => {
    const originalPayload = JSON.stringify({ event: "payment.captured", amount: 1000 });
    const tamperedPayload = JSON.stringify({ event: "payment.captured", amount: 100 });
    const originalSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(originalPayload)
      .digest("hex");

    const isValid = verifyWebhookSignature(tamperedPayload, originalSig, webhookSecret);
    expect(isValid).toBe(false);
  });
});

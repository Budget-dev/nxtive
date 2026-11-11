import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "crypto";

vi.mock("server-only", () => ({}));

const mockOrdersCreate = vi.fn().mockImplementation(async (opts) => ({
  id: `order_mock_${Date.now()}`,
  amount: opts.amount,
  currency: opts.currency,
  receipt: opts.receipt,
  status: "created",
}));

vi.mock("@/server/payments/razorpay/client", () => ({
  getRazorpayInstance: vi.fn(() => ({
    orders: {
      create: mockOrdersCreate,
    },
  })),
}));

import { POST as createOrderHandler } from "@/app/api/razorpay/create-order/route";
import { POST as verifyPaymentHandler } from "@/app/api/razorpay/verify-payment/route";
import { storeSetDocument, storeReadDocument } from "@/lib/firebase/firestore-store";

describe("Razorpay API Routes Integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      RAZORPAY_KEY_ID: "rzp_test_mockKeyId123",
      RAZORPAY_KEY_SECRET: "mockSecret456",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_mockKeyId123",
    };
    mockOrdersCreate.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("POST /api/razorpay/create-order", () => {
    it("returns 400 when amount is invalid or zero", async () => {
      const req = new Request("http://localhost/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 0,
          userId: "usr_test_123",
        }),
      });

      const res = await createOrderHandler(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("positive");
    });

    it("creates an order document in Firestore and returns order details", async () => {
      const req = new Request("http://localhost/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1499,
          currency: "INR",
          userId: "usr_test_789",
          shippingAddress: {
            fullName: "Test Customer",
            email: "customer@example.com",
            phone: "9876543210",
          },
        }),
      });

      const res = await createOrderHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orderId).toBeDefined();
      expect(data.razorpayOrderId).toBeDefined();
      expect(data.amount).toBe(149900); // in paise
      expect(data.currency).toBe("INR");
      expect(data.receipt).toBeDefined();

      // Verify Firestore document was written
      const orderDoc = await storeReadDocument<any>("orders", data.orderId);
      expect(orderDoc).toBeDefined();
      expect(orderDoc?.userId).toBe("usr_test_789");
      expect(orderDoc?.total).toBe(1499);
      expect(orderDoc?.amountPaise).toBe(149900);
    }, 15000);
  });

  describe("POST /api/razorpay/verify-payment", () => {
    it("returns 400 when required verification credentials are missing", async () => {
      const req = new Request("http://localhost/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "ord_missing_sig",
        }),
      });

      const res = await verifyPaymentHandler(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("rejects mismatched cryptographic signature", async () => {
      const orderId = `test_ord_${Date.now()}`;
      await storeSetDocument("orders", orderId, {
        id: orderId,
        orderNumber: "NXT-TEST-01",
        userId: "usr_test_123",
        status: "pending",
        paymentStatus: "pending",
        razorpayOrderId: "order_test_999",
      });

      const req = new Request("http://localhost/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          razorpay_order_id: "order_test_999",
          razorpay_payment_id: "pay_test_001",
          razorpay_signature: "invalid_tampered_signature_hex_value_12345",
        }),
      });

      const res = await verifyPaymentHandler(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("mismatch");
    }, 15000);

    it("successfully verifies authentic signature and is idempotent", async () => {
      const orderId = `test_ord_success_${Date.now()}`;
      const rzpOrderId = "order_test_valid_123";
      const paymentId = "pay_test_valid_789";
      const secret = "mockSecret456";

      await storeSetDocument("orders", orderId, {
        id: orderId,
        orderNumber: "NXT-TEST-SUCCESS",
        userId: "usr_test_123",
        status: "pending",
        paymentStatus: "pending",
        razorpayOrderId: rzpOrderId,
      });

      // Generate authentic HMAC-SHA256 signature
      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(`${rzpOrderId}|${paymentId}`)
        .digest("hex");

      const req = new Request("http://localhost/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        }),
      });

      const res1 = await verifyPaymentHandler(req);
      const data1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data1.status).toBe("paid");
      expect(data1.paymentStatus).toBe("paid");

      // Verify Firestore status was updated
      const updatedOrder = await storeReadDocument<any>("orders", orderId);
      expect(updatedOrder?.status).toBe("paid");
      expect(updatedOrder?.paymentStatus).toBe("paid");
      expect(updatedOrder?.razorpayPaymentId).toBe(paymentId);

      // Verify idempotency: Repeating the verification call returns success without error
      const reqDuplicate = new Request("http://localhost/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        }),
      });

      const res2 = await verifyPaymentHandler(reqDuplicate);
      const data2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(data2.success).toBe(true);
      expect(data2.alreadyProcessed).toBe(true);
    }, 15000);
  });
});

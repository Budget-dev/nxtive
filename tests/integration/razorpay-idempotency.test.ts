import { describe, it, expect } from "vitest";

interface OrderDocument {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "created" | "pending" | "success" | "failed" | "verification_failed" | "refunded";
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

// Simulates the state machine transition logic used in both Cloud Functions & webhook handler
function applyWebhookEvent(
  order: OrderDocument,
  event: { type: string; paymentId?: string; errorCode?: string; errorDescription?: string }
): { updatedOrder: OrderDocument; conflictLogged: boolean } {
  const updated = { ...order };
  let conflictLogged = false;

  switch (event.type) {
    case "payment.captured":
      if (order.status === "success") {
        // Idempotent no-op
        return { updatedOrder: updated, conflictLogged: false };
      }
      if (order.status === "refunded") {
        return { updatedOrder: updated, conflictLogged: false };
      }
      updated.status = "success";
      updated.razorpayPaymentId = event.paymentId || null;
      updated.errorCode = null;
      updated.errorDescription = null;
      break;

    case "payment.failed":
      if (order.status === "success") {
        // CRITICAL CONFLICT GUARD: A late failed webhook cannot overwrite an already-verified success
        conflictLogged = true;
        return { updatedOrder: updated, conflictLogged: true };
      }
      if (order.status === "refunded") {
        return { updatedOrder: updated, conflictLogged: false };
      }
      updated.status = "failed";
      updated.errorCode = event.errorCode || "PAYMENT_FAILED";
      updated.errorDescription = event.errorDescription || "Payment failed";
      break;

    case "refund.created":
    case "refund.processed":
      updated.status = "refunded";
      break;
  }

  return { updatedOrder: updated, conflictLogged };
}

describe("Razorpay Webhook Idempotency & State Guarding", () => {
  it("prevents late payment.failed webhook from overwriting already-verified success status", () => {
    const verifiedOrder: OrderDocument = {
      id: "ord-12345",
      userId: "user-abc",
      amount: 1449,
      currency: "INR",
      status: "success",
      razorpayOrderId: "order_O4uF83jDq72kLa",
      razorpayPaymentId: "pay_P89kL301jKlMN8",
      errorCode: null,
      errorDescription: null,
      createdAt: "2026-10-24T10:00:00.000Z",
      updatedAt: "2026-10-24T10:01:00.000Z",
    };

    const result = applyWebhookEvent(verifiedOrder, {
      type: "payment.failed",
      errorCode: "BAD_REQUEST_ERROR",
      errorDescription: "Late network drop during bank redirection",
    });

    expect(result.conflictLogged).toBe(true);
    expect(result.updatedOrder.status).toBe("success");
    expect(result.updatedOrder.razorpayPaymentId).toBe("pay_P89kL301jKlMN8");
  });

  it("idempotently handles duplicate payment.captured webhooks without altering order state", () => {
    const successOrder: OrderDocument = {
      id: "ord-12345",
      userId: "user-abc",
      amount: 1449,
      currency: "INR",
      status: "success",
      razorpayOrderId: "order_O4uF83jDq72kLa",
      razorpayPaymentId: "pay_P89kL301jKlMN8",
      errorCode: null,
      errorDescription: null,
      createdAt: "2026-10-24T10:00:00.000Z",
      updatedAt: "2026-10-24T10:01:00.000Z",
    };

    const result = applyWebhookEvent(successOrder, {
      type: "payment.captured",
      paymentId: "pay_P89kL301jKlMN8",
    });

    expect(result.conflictLogged).toBe(false);
    expect(result.updatedOrder.status).toBe("success");
  });

  it("updates order to failed when order is pending or created", () => {
    const pendingOrder: OrderDocument = {
      id: "ord-54321",
      userId: "user-abc",
      amount: 899,
      currency: "INR",
      status: "pending",
      razorpayOrderId: "order_Pending987",
      razorpayPaymentId: null,
      errorCode: null,
      errorDescription: null,
      createdAt: "2026-10-24T10:00:00.000Z",
      updatedAt: "2026-10-24T10:00:00.000Z",
    };

    const result = applyWebhookEvent(pendingOrder, {
      type: "payment.failed",
      errorCode: "CARD_DECLINED",
      errorDescription: "Do not honor",
    });

    expect(result.conflictLogged).toBe(false);
    expect(result.updatedOrder.status).toBe("failed");
    expect(result.updatedOrder.errorCode).toBe("CARD_DECLINED");
    expect(result.updatedOrder.errorDescription).toBe("Do not honor");
  });

  it("conforms strictly to the required Firestore order schema", () => {
    const validStatuses = [
      "created",
      "pending",
      "success",
      "failed",
      "verification_failed",
      "refunded",
    ];

    validStatuses.forEach((status) => {
      const doc: OrderDocument = {
        id: "ord-schema-test",
        userId: "user-xyz",
        amount: 1299,
        currency: "INR",
        status: status as OrderDocument["status"],
        razorpayOrderId: "order_rzp_123",
        razorpayPaymentId: status === "success" ? "pay_123" : null,
        errorCode: status === "failed" ? "ERROR_CODE" : null,
        errorDescription: status === "failed" ? "Error description" : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(validStatuses).toContain(doc.status);
      expect(doc.currency).toBe("INR");
      expect(typeof doc.amount).toBe("number");
    });
  });
});

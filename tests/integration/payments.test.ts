import { describe, it, expect } from "vitest";
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/constants/order-status";

describe("Order and Payment Lifecycle Rules", () => {
  it("defines valid forward transitions for pending orders", () => {
    const transitions = ORDER_STATUS_TRANSITIONS["pending"];
    expect(transitions).toContain("payment_confirmed");
    expect(transitions).toContain("cancelled");
  });

  it("defines valid forward transitions from payment_confirmed to processing", () => {
    const transitions = ORDER_STATUS_TRANSITIONS["payment_confirmed"];
    expect(transitions).toContain("processing");
  });

  it("defines valid forward transitions through delivery lifecycle", () => {
    expect(ORDER_STATUS_TRANSITIONS["processing"]).toContain("packed");
    expect(ORDER_STATUS_TRANSITIONS["packed"]).toContain("shipped");
    expect(ORDER_STATUS_TRANSITIONS["shipped"]).toContain("out_for_delivery");
    expect(ORDER_STATUS_TRANSITIONS["out_for_delivery"]).toContain("delivered");
  });

  it("allows transition to return_requested from delivered, but no transition from refunded", () => {
    expect(ORDER_STATUS_TRANSITIONS["delivered"]).toContain("return_requested");
    expect(ORDER_STATUS_TRANSITIONS["refunded"]).toHaveLength(0);
  });

  it("has human-readable labels for all payment statuses", () => {
    expect(PAYMENT_STATUS_LABELS.paid).toBe("Paid");
    expect(PAYMENT_STATUS_LABELS.pending).toBe("Pending");
    expect(PAYMENT_STATUS_LABELS.cancelled).toBe("Cancelled");
    expect(PAYMENT_STATUS_LABELS.cod_pending).toBe("COD Pending");
  });
});

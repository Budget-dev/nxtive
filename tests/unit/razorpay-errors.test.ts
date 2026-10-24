import { describe, it, expect } from "vitest";
import { getRazorpayUserErrorMessage } from "@/lib/razorpay/error-map";

describe("Razorpay Error Code & Failure Reason Mapping", () => {
  it("maps user cancellation to friendly non-alarmist message", () => {
    const res = getRazorpayUserErrorMessage("BAD_REQUEST", "Payment cancelled by user", "customer_cancelled");
    expect(res.code).toBe("PAYMENT_CANCELLED");
    expect(res.userMessage).toContain("cancelled");
    expect(res.isRetryable).toBe(true);
  });

  it("maps card declined to specific banking guidance", () => {
    const res = getRazorpayUserErrorMessage("BAD_REQUEST_ERROR", "Card was declined by issuing bank", "card_declined");
    expect(res.code).toBe("CARD_DECLINED");
    expect(res.userMessage).toContain("declined");
    expect(res.actionHint).toContain("card");
    expect(res.isRetryable).toBe(true);
  });

  it("maps insufficient funds accurately", () => {
    const res = getRazorpayUserErrorMessage("PAYMENT_FAILED", "Not enough balance", "insufficient_funds");
    expect(res.code).toBe("INSUFFICIENT_FUNDS");
    expect(res.userMessage).toContain("Insufficient funds");
    expect(res.isRetryable).toBe(true);
  });

  it("maps 3D Secure / OTP failure", () => {
    const res = getRazorpayUserErrorMessage("AUTHENTICATION_FAILED", "OTP verification timed out", "3d_secure_failed");
    expect(res.code).toBe("AUTHENTICATION_FAILED");
    expect(res.userMessage).toContain("3D Secure OTP");
    expect(res.isRetryable).toBe(true);
  });

  it("maps bank / gateway timeout to reassuring message about potential deductions", () => {
    const res = getRazorpayUserErrorMessage("GATEWAY_ERROR", "Bank server unresponsive", "bank_timeout");
    expect(res.code).toBe("BANK_TIMEOUT");
    expect(res.userMessage).toContain("gateway took too long");
    expect(res.actionHint).toContain("refunded within 3-5 days");
  });

  it("maps network timeout during verification", () => {
    const res = getRazorpayUserErrorMessage("NETWORK_ERROR", "Failed to fetch response", "network");
    expect(res.code).toBe("NETWORK_TIMEOUT");
    expect(res.actionHint).toContain("verifying your transaction");
  });
});

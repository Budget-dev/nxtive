// User-facing error message mapping for Razorpay client and server errors

export interface MappedPaymentError {
  code: string;
  userMessage: string;
  actionHint: string;
  isRetryable: boolean;
}

export function getRazorpayUserErrorMessage(
  code?: string | null,
  description?: string | null,
  reason?: string | null
): MappedPaymentError {
  const c = (code || "").toUpperCase();
  const r = (reason || "").toLowerCase();
  const d = (description || "").toLowerCase();

  // 1. User dismissed / cancelled
  if (r.includes("cancelled") || c.includes("CANCEL") || d.includes("cancelled") || r.includes("customer_cancelled")) {
    return {
      code: "PAYMENT_CANCELLED",
      userMessage: "Payment was cancelled.",
      actionHint: "You can retry checkout whenever you're ready.",
      isRetryable: true,
    };
  }

  // 2. Insufficient balance
  if (r.includes("insufficient_funds") || c.includes("INSUFFICIENT_FUNDS") || d.includes("insufficient")) {
    return {
      code: "INSUFFICIENT_FUNDS",
      userMessage: "Insufficient funds in your account or card.",
      actionHint: "Please choose another payment method, UPI, or card.",
      isRetryable: true,
    };
  }

  // 3. Card declined
  if (r.includes("card_declined") || c.includes("CARD_DECLINED") || r.includes("do_not_honor") || d.includes("declined")) {
    return {
      code: "CARD_DECLINED",
      userMessage: "Your card was declined by the issuing bank.",
      actionHint: "Please check your card limit, enable online transactions, or try a different card/UPI.",
      isRetryable: true,
    };
  }

  // 4. 3D Secure / OTP failed
  if (r.includes("3d_secure") || r.includes("otp") || r.includes("auth_failed") || c.includes("AUTHENTICATION_FAILED") || d.includes("otp")) {
    return {
      code: "AUTHENTICATION_FAILED",
      userMessage: "3D Secure OTP verification failed or timed out.",
      actionHint: "Please retry and enter the correct OTP sent to your registered mobile number.",
      isRetryable: true,
    };
  }

  // 5. Bank / Gateway Timeout
  if (r.includes("bank_timeout") || r.includes("gateway_timeout") || c.includes("GATEWAY_ERROR") || d.includes("timeout")) {
    return {
      code: "BANK_TIMEOUT",
      userMessage: "The bank gateway took too long to respond.",
      actionHint: "If money was debited, it will be refunded within 3-5 days. You can retry with UPI or another bank.",
      isRetryable: true,
    };
  }

  // 6. Network timeout during verification
  if (c.includes("NETWORK") || d.includes("network") || d.includes("fetch")) {
    return {
      code: "NETWORK_TIMEOUT",
      userMessage: "Network connection was interrupted while confirming your payment.",
      actionHint: "We're verifying your transaction with the payment gateway. Please wait a moment.",
      isRetryable: true,
    };
  }

  // Default fallback
  return {
    code: c || "PAYMENT_ERROR",
    userMessage: description || "Your payment could not be processed.",
    actionHint: "Please retry with a fresh order or use a different payment method.",
    isRetryable: true,
  };
}

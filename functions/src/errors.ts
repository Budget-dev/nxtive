/**
 * Comprehensive mapping of Razorpay error codes and payment failure reasons
 * to actionable, user-friendly messages.
 */

export interface FormattedPaymentError {
  code: string;
  userMessage: string;
  retryable: boolean;
  technicalDetails?: string;
}

export function mapRazorpayError(
  errorCode?: string | null,
  errorDescription?: string | null,
  errorReason?: string | null
): FormattedPaymentError {
  const code = (errorCode || "").toUpperCase();
  const reason = (errorReason || "").toLowerCase();
  const desc = errorDescription || "";

  // 1. User cancellation
  if (
    reason.includes("cancelled") ||
    reason.includes("customer_cancelled") ||
    code.includes("CANCEL") ||
    desc.toLowerCase().includes("cancelled")
  ) {
    return {
      code: "PAYMENT_CANCELLED",
      userMessage: "Payment was cancelled. You can retry anytime when you're ready.",
      retryable: true,
      technicalDetails: desc || "User closed payment window",
    };
  }

  // 2. Card declined
  if (
    reason.includes("card_declined") ||
    code.includes("CARD_DECLINED") ||
    reason.includes("do_not_honor") ||
    desc.toLowerCase().includes("declined")
  ) {
    return {
      code: "CARD_DECLINED",
      userMessage: "Your card was declined by the bank. Please try another card, UPI, or Net Banking.",
      retryable: true,
      technicalDetails: desc,
    };
  }

  // 3. Insufficient funds
  if (
    reason.includes("insufficient_funds") ||
    code.includes("INSUFFICIENT_FUNDS") ||
    desc.toLowerCase().includes("insufficient")
  ) {
    return {
      code: "INSUFFICIENT_FUNDS",
      userMessage: "Insufficient balance in your account. Please select another payment method.",
      retryable: true,
      technicalDetails: desc,
    };
  }

  // 4. 3D Secure / OTP Authentication Failure
  if (
    reason.includes("3d_secure") ||
    reason.includes("otp") ||
    reason.includes("auth_failed") ||
    code.includes("AUTHENTICATION_FAILED") ||
    desc.toLowerCase().includes("otp") ||
    desc.toLowerCase().includes("authentication")
  ) {
    return {
      code: "AUTH_FAILED",
      userMessage: "3D Secure OTP verification failed or timed out. Please retry with a valid OTP.",
      retryable: true,
      technicalDetails: desc,
    };
  }

  // 5. Bank / Gateway Timeout
  if (
    reason.includes("bank_timeout") ||
    reason.includes("gateway_timeout") ||
    code.includes("GATEWAY_ERROR") ||
    code.includes("TIMEOUT") ||
    desc.toLowerCase().includes("timeout")
  ) {
    return {
      code: "BANK_TIMEOUT",
      userMessage: "The bank server took too long to respond. If money was debited, it will be refunded within 3-5 business days.",
      retryable: true,
      technicalDetails: desc,
    };
  }

  // 6. Signature verification failure
  if (code.includes("SIGNATURE") || reason.includes("signature")) {
    return {
      code: "VERIFICATION_FAILED",
      userMessage: "Payment signature verification failed. Please contact support if your account was debited.",
      retryable: false,
      technicalDetails: desc || "HMAC signature mismatch",
    };
  }

  // Fallback for general errors
  return {
    code: code || "PAYMENT_FAILED",
    userMessage: desc || "Unable to complete transaction. Please choose a different payment method and retry.",
    retryable: true,
    technicalDetails: `Reason: ${reason || "unknown"}, Description: ${desc || "none"}`,
  };
}

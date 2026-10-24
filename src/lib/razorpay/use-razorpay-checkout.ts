// Production-grade client-side hook for Razorpay Checkout integration.
// Handles all payment outcomes (success, failure, modal dismissal/cancellation, network drops)
// and utilizes Firestore realtime listeners / polling as the webhook source of truth.

"use client";

import { useState, useCallback, useRef } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { getRazorpayUserErrorMessage, type MappedPaymentError } from "./error-map";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    confirm_close?: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: string, handler: (response: any) => void) => void;
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
  image: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface RazorpayCheckoutInput {
  items: CartItem[];
  shippingAddress: ShippingAddress;
  deliveryMethod: string;
  couponCode?: string;
  userId: string;
}

export type CheckoutStatus =
  | "idle"
  | "creating_order"
  | "awaiting_payment"
  | "verifying"
  | "confirming_with_webhook"
  | "success"
  | "failed";

export interface RazorpayCheckoutResult {
  success: boolean;
  orderId?: string;
  razorpayOrderId?: string;
  paymentId?: string;
  error?: string;
  mappedError?: MappedPaymentError;
  status: CheckoutStatus;
}

// Dynamically injects checkout.js script if not present
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpayCheckout() {
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappedError, setMappedError] = useState<MappedPaymentError | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [confirmingMessage, setConfirmingMessage] = useState<string | null>(null);

  const activeListenerUnsubRef = useRef<(() => void) | null>(null);

  const cleanupListener = () => {
    if (activeListenerUnsubRef.current) {
      activeListenerUnsubRef.current();
      activeListenerUnsubRef.current = null;
    }
  };

  /**
   * Listens or polls Firestore `orders/{orderId}` for webhook updates.
   * Used when verification network request times out or when modal is dismissed.
   */
  const waitForWebhookResolution = useCallback(
    (orderId: string, timeoutMs: number = 15000): Promise<RazorpayCheckoutResult> => {
      return new Promise((resolve) => {
        cleanupListener();
        setStatus("confirming_with_webhook");
        setConfirmingMessage("We're confirming your payment with your bank. Please wait...");

        let resolved = false;

        const timer = setTimeout(async () => {
          if (resolved) return;
          resolved = true;
          cleanupListener();

          // Final snapshot check
          try {
            const snap = await getDoc(doc(db, "orders", orderId));
            if (snap.exists() && snap.data()?.status === "success") {
              setStatus("success");
              setConfirmingMessage(null);
              resolve({
                success: true,
                orderId,
                status: "success",
              });
              return;
            }
          } catch (e) {
            console.warn("[Razorpay] Final check error:", e);
          }

          const timeoutErr = getRazorpayUserErrorMessage(
            "TIMEOUT",
            "Payment confirmation is taking longer than expected. If money was debited, your order will update shortly.",
            "bank_timeout"
          );
          setStatus("failed");
          setError(timeoutErr.userMessage);
          setMappedError(timeoutErr);
          setConfirmingMessage(null);
          resolve({
            success: false,
            orderId,
            error: timeoutErr.userMessage,
            mappedError: timeoutErr,
            status: "failed",
          });
        }, timeoutMs);

        try {
          const unsub = onSnapshot(
            doc(db, "orders", orderId),
            (snapshot: any) => {
              if (!snapshot.exists()) return;
              const data = snapshot.data();
              if (data?.status === "success") {
                if (resolved) return;
                resolved = true;
                clearTimeout(timer);
                cleanupListener();
                setStatus("success");
                setConfirmingMessage(null);
                resolve({
                  success: true,
                  orderId,
                  status: "success",
                });
              } else if (data?.status === "failed") {
                if (resolved) return;
                resolved = true;
                clearTimeout(timer);
                cleanupListener();
                const err = getRazorpayUserErrorMessage(data.errorCode, data.errorDescription, data.errorReason);
                setStatus("failed");
                setError(err.userMessage);
                setMappedError(err);
                setConfirmingMessage(null);
                resolve({
                  success: false,
                  orderId,
                  error: err.userMessage,
                  mappedError: err,
                  status: "failed",
                });
              }
            },
            (err: any) => {
              console.warn("[Razorpay] Snapshot listener error:", err);
            }
          );
          activeListenerUnsubRef.current = unsub;
        } catch (subErr) {
          console.warn("[Razorpay] Could not attach realtime listener:", subErr);
        }
      });
    },
    []
  );

  /**
   * Main checkout kickoff. Always creates a FRESH order doc and order ID.
   */
  const initiatePayment = useCallback(
    async (input: RazorpayCheckoutInput): Promise<RazorpayCheckoutResult> => {
      cleanupListener();
      setLoading(true);
      setError(null);
      setMappedError(null);
      setConfirmingMessage(null);
      setStatus("creating_order");

      try {
        // Step 1: Create Order Server-Side (via Cloud Function or API fallback)
        let createData: any;
        try {
          // Attempt Firebase Cloud Function
          const createOrderFn = httpsCallable<any, any>(functions, "createRazorpayOrder");
          const fnRes = await createOrderFn({
            items: input.items.map((i) => ({
              productId: i.id,
              quantity: i.quantity,
              selectedSize: i.selectedSize,
              selectedColor: i.selectedColor,
            })),
            shippingAddress: input.shippingAddress,
            deliveryMethod: input.deliveryMethod,
            couponCode: input.couponCode,
            metadata: {
              userId: input.userId,
            },
          });
          createData = fnRes.data;
        } catch (fnErr) {
          console.info("[Payment] Falling back to Next.js API route for order creation:", fnErr);
          const apiRes = await fetch("/api/payments/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: input.items,
              shippingAddress: input.shippingAddress,
              deliveryMethod: input.deliveryMethod,
              couponCode: input.couponCode,
              userId: input.userId,
            }),
          });
          createData = await apiRes.json();
        }

        if (!createData || !createData.success || !createData.orderId) {
          throw new Error(createData?.error || "Failed to create order on server.");
        }

        const { orderId, razorpayOrderId, amount, currency, keyId } = createData;
        setCurrentOrderId(orderId);

        // Ensure SDK script is ready
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || typeof window === "undefined" || !window.Razorpay) {
          throw new Error("Razorpay Checkout SDK could not be loaded. Please check your internet connection.");
        }

        setStatus("awaiting_payment");

        // Step 2: Open Razorpay Checkout Modal
        return new Promise<RazorpayCheckoutResult>((resolve) => {
          let hasHandledCallback = false;

          const options: RazorpayOptions = {
            key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
            amount,
            currency: currency || "INR",
            name: "NXTIVE",
            description: `Order ${orderId}`,
            order_id: razorpayOrderId,
            prefill: {
              name: input.shippingAddress.fullName,
              email: input.shippingAddress.email,
              contact: input.shippingAddress.phone,
            },
            theme: {
              color: "#111110",
            },
            // 2a. Payment success callback
            handler: async (response: RazorpayPaymentResponse) => {
              hasHandledCallback = true;
              setStatus("verifying");

              // Step 3: Verification with network timeout handling
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 12000);

              try {
                let verifyData: any;
                try {
                  const verifyFn = httpsCallable<any, any>(functions, "verifyRazorpayPayment");
                  const res = await verifyFn({
                    orderId,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                  verifyData = res.data;
                } catch (fnErr: any) {
                  console.info("[Payment] Falling back to Next.js API for verification:", fnErr);
                  const apiRes = await fetch("/api/payments/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                      orderId,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                    }),
                  });
                  verifyData = await apiRes.json();
                }

                clearTimeout(timeoutId);

                if (verifyData && verifyData.success) {
                  setStatus("success");
                  setLoading(false);
                  resolve({
                    success: true,
                    orderId,
                    razorpayOrderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    status: "success",
                  });
                } else {
                  // Gateway rejected signature
                  const mapped = getRazorpayUserErrorMessage(
                    "SIGNATURE_FAILED",
                    verifyData?.error || "Signature verification failed",
                    "verification_failed"
                  );
                  setStatus("failed");
                  setError(mapped.userMessage);
                  setMappedError(mapped);
                  setLoading(false);
                  resolve({
                    success: false,
                    orderId,
                    error: mapped.userMessage,
                    mappedError: mapped,
                    status: "failed",
                  });
                }
              } catch (verifyErr: any) {
                clearTimeout(timeoutId);
                console.warn("[Payment] Network or timeout during verification. Activating webhook poller:", verifyErr);

                // Step 6: Network issue / Timeout handling
                // Instead of failing, poll or listen to the Firestore order doc for webhook resolution
                const webhookRes = await waitForWebhookResolution(orderId, 15000);
                setLoading(false);
                resolve(webhookRes);
              }
            },
            modal: {
              // 2c. Modal dismissed / user cancels / network drops before callback
              ondismiss: async () => {
                if (hasHandledCallback) return;
                console.info("[Payment] Checkout modal dismissed. Checking pending status via webhook...");

                // Treat as "pending" — check if webhook processed payment before user closed
                const webhookRes = await waitForWebhookResolution(orderId, 8000);
                if (webhookRes.success) {
                  setLoading(false);
                  resolve(webhookRes);
                } else {
                  const mapped = getRazorpayUserErrorMessage("PAYMENT_CANCELLED", "Checkout was closed.", "cancelled");
                  setStatus("failed");
                  setError(mapped.userMessage);
                  setMappedError(mapped);
                  setLoading(false);
                  resolve({
                    success: false,
                    orderId,
                    error: mapped.userMessage,
                    mappedError: mapped,
                    status: "failed",
                  });
                }
              },
              escape: true,
              confirm_close: true,
            },
          };

          const rzp = new window.Razorpay!(options);

          // 2b. Payment failure callback
          rzp.on("payment.failed", (response: any) => {
            hasHandledCallback = true;
            console.error("[Razorpay] payment.failed fired on client:", response?.error);
            const err = response?.error;
            const mapped = getRazorpayUserErrorMessage(err?.code, err?.description, err?.reason);

            setStatus("failed");
            setError(mapped.userMessage);
            setMappedError(mapped);
            setLoading(false);
            resolve({
              success: false,
              orderId,
              error: mapped.userMessage,
              mappedError: mapped,
              status: "failed",
            });
          });

          rzp.open();
        });
      } catch (err: any) {
        console.error("[Payment] Initiation error:", err);
        const mapped = getRazorpayUserErrorMessage("INITIATION_ERROR", err?.message, "network_error");
        setStatus("failed");
        setError(mapped.userMessage);
        setMappedError(mapped);
        setLoading(false);
        return {
          success: false,
          error: mapped.userMessage,
          mappedError: mapped,
          status: "failed",
        };
      }
    },
    [waitForWebhookResolution]
  );

  const reset = useCallback(() => {
    cleanupListener();
    setStatus("idle");
    setLoading(false);
    setError(null);
    setMappedError(null);
    setConfirmingMessage(null);
    setCurrentOrderId(null);
  }, []);

  return {
    initiatePayment,
    reset,
    status,
    loading,
    error,
    mappedError,
    currentOrderId,
    confirmingMessage,
    clearError: () => {
      setError(null);
      setMappedError(null);
    },
  };
}

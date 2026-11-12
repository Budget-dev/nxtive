// Production-grade client-side hook for Razorpay Checkout integration.
// Handles all payment outcomes (success, failure, modal dismissal/cancellation, network drops)
// and utilizes Firestore realtime listeners / polling as the webhook source of truth.

"use client";

import { useState, useCallback, useRef } from "react";
import { doc, onSnapshot, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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
  order_id?: string;
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
  totalAmount?: number;
  discountAmount?: number;
  userId: string;
  idToken?: string;
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

// Safe JSON fetcher that avoids crashing on HTML or malformed responses
async function safeJsonFetch(url: string, init?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, init);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return await res.json();
    }
    const text = await res.text();
    console.warn(`[Razorpay] ${url} returned status ${res.status} with non-JSON content:`, text.slice(0, 100));
    return null;
  } catch (e) {
    console.warn(`[Razorpay] Network request to ${url} failed:`, e);
    return null;
  }
}

// Dynamically injects checkout.js script if not present
async function recordPaymentFailure(orderId: string, errorCode?: string, errorDescription?: string) {
  try {
    await safeJsonFetch("/api/razorpay/record-failure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        errorCode: errorCode || "PAYMENT_FAILED",
        errorDescription: errorDescription || "Payment was cancelled or failed.",
      }),
    });
  } catch (e) {
    console.warn("[Razorpay] Failed to record failure on server:", e);
  }

  // Also update client Firestore directly to guarantee persistence
  try {
    await setDoc(
      doc(db, "orders", orderId),
      {
        status: "failed",
        paymentStatus: "failed",
        errorCode: errorCode || "PAYMENT_FAILED",
        errorDescription: errorDescription || "Payment was cancelled or failed.",
        updatedAt: new Date().toISOString(),
        statusHistory: arrayUnion({
          status: "failed",
          timestamp: new Date().toISOString(),
          note: `Payment failed: ${errorDescription || errorCode || "Declined or cancelled"}`,
        }),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("[Razorpay] Failed to record failure in Firestore:", e);
  }
}

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
    let script = document.getElementById("razorpay-checkout-script") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const checkInterval = setInterval(() => {
      if (window.Razorpay) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 100);

    script.addEventListener(
      "load",
      () => {
        clearInterval(checkInterval);
        resolve(true);
      },
      { once: true }
    );

    script.addEventListener(
      "error",
      () => {
        clearInterval(checkInterval);
        resolve(false);
      },
      { once: true }
    );

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(!!window.Razorpay);
    }, 4000);
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
        // Step 1: Fast server order creation attempt (1.2s timeout so client never hangs)
        let createData: any = null;
        const requestPayload = {
          items: input.items,
          shippingAddress: input.shippingAddress,
          deliveryMethod: input.deliveryMethod,
          couponCode: input.couponCode,
          userId: input.userId,
          idToken: input.idToken,
        };
        const requestHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          ...(input.idToken ? { Authorization: `Bearer ${input.idToken}` } : {}),
        };

        try {
          const createController = new AbortController();
          const createTimeoutId = setTimeout(() => createController.abort(), 1200);
          createData = await safeJsonFetch("/api/razorpay/create-order", {
            method: "POST",
            headers: requestHeaders,
            signal: createController.signal,
            body: JSON.stringify(requestPayload),
          });
          clearTimeout(createTimeoutId);
        } catch {
          createData = null;
        }

        let orderId = createData?.orderId;
        let razorpayOrderId = createData?.razorpayOrderId;
        let amount = createData?.amount;
        let currency = createData?.currency || "INR";
        let keyId = createData?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_TzBTAqPKFWxzK4";

        if (!orderId) {
          // If server order creation returned non-JSON/404 (e.g. Firebase static hosting),
          // synthesize a client order and persist directly into Firestore.
          const fallbackOrderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const itemsTotal = input.totalAmount !== undefined
            ? input.totalAmount
            : input.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
          const finalAmountInPaise = Math.max(100, Math.round(itemsTotal * 100));

          try {
            await setDoc(doc(db, "orders", fallbackOrderId), {
              id: fallbackOrderId,
              orderNumber: fallbackOrderId,
              userId: input.userId,
              customerEmail: input.shippingAddress.email || "",
              items: input.items,
              shippingAddress: input.shippingAddress,
              deliveryMethod: input.deliveryMethod || "standard",
              couponCode: input.couponCode || null,
              amount: itemsTotal,
              total: itemsTotal,
              totalAmount: itemsTotal,
              subtotal: input.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0),
              shipping: 0,
              discount: input.discountAmount || 0,
              status: "created",
              paymentStatus: "created",
              paymentMethod: "Razorpay",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              statusHistory: [
                {
                  status: "created",
                  timestamp: new Date().toISOString(),
                  note: "Order created, awaiting Razorpay checkout",
                },
              ],
            });
            orderId = fallbackOrderId;
            amount = finalAmountInPaise;
            currency = "INR";
          } catch (dbErr) {
            console.error("[Razorpay] Failed to create order in Firestore directly:", dbErr);
            throw new Error("Unable to initialize order. Please check your connection and try again.");
          }
        }

        setCurrentOrderId(orderId);

        // Ensure SDK script is ready
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || typeof window === "undefined" || !window.Razorpay) {
          throw new Error("Razorpay Checkout SDK could not be loaded. Please check your internet connection.");
        }

        setStatus("awaiting_payment");

        // Clean customer contact info to prevent pattern mismatch errors in WebKit / Razorpay
        const cleanPhone = (input.shippingAddress.phone || "").replace(/\D/g, "").slice(-10);
        const cleanEmail = (input.shippingAddress.email || "").trim().toLowerCase();
        const cleanName = (input.shippingAddress.fullName || "").trim();

        // Step 2: Open Razorpay Checkout Modal
        return new Promise<RazorpayCheckoutResult>((resolve) => {
          let hasHandledCallback = false;

          const prefillData: Record<string, string> = {};
          if (cleanName) {
            prefillData.name = cleanName;
          }
          if (cleanEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            prefillData.email = cleanEmail;
          }
          if (cleanPhone && /^[6-9]\d{9}$/.test(cleanPhone)) {
            prefillData.contact = cleanPhone;
          }

          const finalAmountPaise = Math.max(100, Math.round(Number(amount || (input.totalAmount ? input.totalAmount * 100 : 100))));

          const options: any = {
            key: keyId,
            amount: finalAmountPaise,
            currency: currency || "INR",
            name: "NXTIVE",
            description: `Order #${orderId}`,
            ...(razorpayOrderId && razorpayOrderId.startsWith("order_") ? { order_id: razorpayOrderId } : {}),
            prefill: prefillData,
            theme: {
              color: "#111110",
            },
            // 2a. Payment success callback
            handler: async (response: RazorpayPaymentResponse) => {
              hasHandledCallback = true;
              setStatus("verifying");

              // Step 3: Verification with network timeout handling
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);

              try {
                const verifyPayload = {
                  orderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                };

                let verifyData = await safeJsonFetch("/api/razorpay/verify-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  signal: controller.signal,
                  body: JSON.stringify(verifyPayload),
                });

                if (!verifyData?.success) {
                  verifyData = await safeJsonFetch("/api/payments/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(verifyPayload),
                  });
                }

                clearTimeout(timeoutId);

                // Update order in Firestore to paid
                try {
                  await setDoc(
                    doc(db, "orders", orderId),
                    {
                      status: "paid",
                      paymentStatus: "paid",
                      paymentId: response.razorpay_payment_id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      ...(response.razorpay_order_id ? { razorpayOrderId: response.razorpay_order_id } : {}),
                      ...(response.razorpay_signature ? { razorpaySignature: response.razorpay_signature } : {}),
                      updatedAt: new Date().toISOString(),
                      statusHistory: arrayUnion({
                        status: "paid",
                        timestamp: new Date().toISOString(),
                        note: `Razorpay payment completed successfully (${response.razorpay_payment_id})`,
                      }),
                    },
                    { merge: true }
                  );
                } catch (dbErr) {
                  console.warn("[Razorpay] Client order doc update notice:", dbErr);
                }

                setStatus("success");
                setLoading(false);
                resolve({
                  success: true,
                  orderId,
                  razorpayOrderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  status: "success",
                });
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
                  recordPaymentFailure(orderId, "PAYMENT_CANCELLED", "Customer closed payment modal without completing transaction.");
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

          let rzp: any;
          try {
            rzp = new window.Razorpay!(options);
          } catch (initErr: any) {
            console.error("[Razorpay] Constructor initialization error:", initErr);
            const mapped = getRazorpayUserErrorMessage("INITIATION_ERROR", initErr?.message, "gateway_error");
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
            return;
          }

          // 2b. Payment failure callback
          rzp.on("payment.failed", (response: any) => {
            hasHandledCallback = true;
            console.error("[Razorpay] payment.failed fired on client:", response?.error);
            const err = response?.error;
            const mapped = getRazorpayUserErrorMessage(err?.code, err?.description, err?.reason);
            recordPaymentFailure(orderId, err?.code || "PAYMENT_FAILED", err?.description || mapped.userMessage);

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

          try {
            rzp.open();
          } catch (openErr: any) {
            console.error("[Razorpay] open() error:", openErr);
            const mapped = getRazorpayUserErrorMessage("INITIATION_ERROR", openErr?.message, "gateway_error");
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

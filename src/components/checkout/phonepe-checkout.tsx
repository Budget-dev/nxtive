"use client";

// components/checkout/phonepe-checkout.tsx
//
// Direct PhonePe UPI & Universal UPI QR Checkout Component with Return Detection.
// Flow:
//   1. Customer taps "Pay with PhonePe" (or "Pay ₹149 Advance for COD") ->
//      creates Firestore order with formatted NXTIVE order number and displays
//      a 100% compliant NPCI UPI QR code + deep-links for PhonePe/GPay/Paytm.
//   2. Customer redirects to PhonePe or scans QR.
//   3. When customer returns to the website:
//      - Automatic popup modal detects return: "Did you complete your payment on PhonePe? [Yes / No]"
//      - If Yes: Asks for 12-digit Transaction ID / UTR, with visual guide on where to find it.
//      - If No: Offers to retry payment or return to checkout.
//   4. Order is updated with UTR, confirmed in Firestore, and routed to /checkout/success.

import React, { useEffect, useState } from "react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Banknote,
  Info,
  RefreshCw,
  X,
  CreditCard,
  ClipboardPaste,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  buildPhonePeLink,
  buildGenericUpiLink,
  isMobile,
  DEFAULT_VPA,
  DEFAULT_NAME,
  DEFAULT_QR_IMAGE,
} from "@/lib/upi";
import { generateOrderNumber } from "@/utils/slugify";

export interface PhonePeCheckoutProps {
  amount: number; // Amount payable now (149 for COD; finalTotal for Prepaid UPI)
  totalOrderAmount?: number; // Total value of order
  isCod?: boolean; // Whether this is ₹149 advance for COD
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  userId?: string;
  shippingAddress?: any;
  deliveryMethod?: string;
  items?: any[];
  onSuccess?: (orderId: string, utr: string, orderNumber: string, orderData?: any) => void;
  onError?: (err: string) => void;
}

const PAYEE_VPA = process.env.NEXT_PUBLIC_PHONEPE_VPA || DEFAULT_VPA;
const PAYEE_NAME = process.env.NEXT_PUBLIC_PHONEPE_NAME || DEFAULT_NAME;
const QR_IMAGE = process.env.NEXT_PUBLIC_PHONEPE_QR_IMAGE || DEFAULT_QR_IMAGE;

export function PhonePeCheckout({
  amount,
  totalOrderAmount,
  isCod = false,
  customerName,
  customerPhone,
  customerEmail,
  userId,
  shippingAddress,
  deliveryMethod,
  items,
  onSuccess,
  onError,
}: PhonePeCheckoutProps) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [phonepeLink, setPhonepeLink] = useState<string | null>(null);
  const [genericLink, setGenericLink] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "created" | "submitted">("idle");
  const [qrMode, setQrMode] = useState<"phonepe_standee" | "dynamic">("phonepe_standee");
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Return from PhonePe modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [modalStep, setModalStep] = useState<"ask_paid" | "enter_utr" | "not_paid">("ask_paid");
  const [modalUtr, setModalUtr] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [guideTab, setGuideTab] = useState<"phonepe" | "gpay" | "paytm" | "sms">("phonepe");
  const [showInlineGuide, setShowInlineGuide] = useState(false);

  const fullOrderValue = totalOrderAmount && totalOrderAmount > 0 ? totalOrderAmount : amount;
  const codBalanceDue = isCod ? Math.max(0, fullOrderValue - amount) : 0;

  // Detect mobile device
  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  // Sync modal UTR with main UTR
  useEffect(() => {
    if (utr && !modalUtr) {
      setModalUtr(utr);
    }
  }, [utr, modalUtr]);

  // Resume in-progress order if customer reloads tab or returns from app
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("phonepe_order") || localStorage.getItem("phonepe_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orderId && parsed.amount === amount) {
          setOrderId(parsed.orderId);
          setOrderNumber(parsed.orderNumber || null);
          setPhonepeLink(parsed.phonepeLink);
          setGenericLink(parsed.genericLink);
          setStep("created");
        }
      }
    } catch {
      // Ignore storage parsing errors
    }
  }, [amount]);

  // Track customer returning from PhonePe app/tab
  useEffect(() => {
    function checkCustomerReturn() {
      if (typeof window === "undefined") return;
      const redirectedAt =
        sessionStorage.getItem("phonepe_redirected_at") ||
        localStorage.getItem("phonepe_redirected_at");

      if (redirectedAt && (step === "created" || orderId)) {
        const elapsed = Date.now() - Number(redirectedAt);
        // If at least 1.5 seconds have elapsed since redirect, customer has returned
        if (elapsed > 1500) {
          setShowReturnModal(true);
          setModalStep("ask_paid");
        }
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkCustomerReturn();
      }
    };

    const onWindowFocus = () => {
      checkCustomerReturn();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onWindowFocus);

    // Initial check on mount
    checkCustomerReturn();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [step, orderId]);

  function markRedirect() {
    if (typeof window !== "undefined") {
      const now = String(Date.now());
      sessionStorage.setItem("phonepe_redirected_at", now);
      localStorage.setItem("phonepe_redirected_at", now);
    }
  }

  async function handlePay() {
    if (!customerName?.trim() || !customerPhone?.trim()) {
      const msg = "Please enter your full name and 10-digit mobile number before proceeding to payment.";
      setError(msg);
      onError?.(msg);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const generatedOrderNumber = generateOrderNumber();
      const orderPayload: Record<string, any> = {
        orderNumber: generatedOrderNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail?.trim() || "",
        uid: userId || null,
        userId: userId || null,
        amount: Number(fullOrderValue),
        subtotal: Number(fullOrderValue),
        total: Number(fullOrderValue),
        totalAmount: Number(fullOrderValue),
        discount: 0,
        shipping: 0,
        advanceAmount: isCod ? Number(amount) : Number(fullOrderValue),
        codBalanceDue: isCod ? Number(codBalanceDue) : 0,
        items: (items || []).map((item) => ({
          id: item.id || item.productId || "",
          productId: item.id || item.productId || "",
          title: item.title || "Item",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          selectedSize: item.selectedSize || "M",
          selectedColor: item.selectedColor || "",
          image: item.image || "",
        })),
        shippingAddress: shippingAddress || {},
        deliveryMethod: deliveryMethod || "Standard Domestic (3-5 Days)",
        deliveryDateEstimate: "3-5 Business Days",
        trackingNumber: generatedOrderNumber,
        status: "pending",
        paymentMethod: isCod ? "cod_partial" : "phonepe",
        paymentStatus: isCod ? "advance_pending" : "pending_verification",
        paymentTransactionId: null,
        upiTransactionId: null,
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date().toISOString(),
            note: isCod
              ? `Order created with COD (₹${amount} advance booking fee due via UPI; ₹${codBalanceDue} due on delivery).`
              : "Prepaid PhonePe UPI checkout initiated.",
          },
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, "orders"), orderPayload);

      const linkArgs = {
        payeeVpa: PAYEE_VPA,
        payeeName: PAYEE_NAME,
        amount, // ₹149 for COD advance; full total for Prepaid UPI
        orderId: ref.id,
        note: isCod
          ? `NXTIVE COD Adv ${generatedOrderNumber}`
          : `NXTIVE Order ${generatedOrderNumber}`,
      };
      const ppLink = buildPhonePeLink(linkArgs);
      const upiLink = buildGenericUpiLink(linkArgs);

      const orderData = {
        orderId: ref.id,
        orderNumber: generatedOrderNumber,
        amount,
        phonepeLink: ppLink,
        genericLink: upiLink,
      };

      sessionStorage.setItem("phonepe_order", JSON.stringify(orderData));
      localStorage.setItem("phonepe_order", JSON.stringify(orderData));

      markRedirect();

      setOrderId(ref.id);
      setOrderNumber(generatedOrderNumber);
      setPhonepeLink(ppLink);
      setGenericLink(upiLink);
      setStep("created");

      // Mobile: trigger PhonePe app deep-link if available
      if (isMobile()) {
        try {
          window.location.href = ppLink;
        } catch {
          // Ignore redirect errors on mobile
        }
      }
    } catch (e: any) {
      console.error("PhonePe order creation failed:", e);
      const errorMsg = e?.message || "Couldn't initiate UPI payment. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitTransaction(e?: React.FormEvent | React.MouseEvent, customUtr?: string) {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    const cleanUtr = (customUtr || modalUtr || utr).trim();
    if (!cleanUtr) {
      const msg = "Please enter the 12-digit UTR or Transaction ID shown in PhonePe / UPI app.";
      setError(msg);
      setModalError(msg);
      return;
    }
    if (!orderId) {
      const msg = "Active order not found. Please click 'Pay with PhonePe' again.";
      setError(msg);
      setModalError(msg);
      return;
    }

    setBusy(true);
    setError(null);
    setModalError(null);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        upiTransactionId: cleanUtr,
        paymentTransactionId: cleanUtr,
        status: "processing",
        paymentStatus: isCod ? "advance_submitted" : "pending_verification",
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date().toISOString(),
            note: isCod
              ? `Order created with COD (₹${amount} advance booking fee due via UPI; ₹${codBalanceDue} due on delivery).`
              : "Prepaid PhonePe UPI checkout initiated.",
          },
          {
            status: isCod ? "advance_submitted" : "pending_verification",
            timestamp: new Date().toISOString(),
            note: isCod
              ? `₹${amount} advance payment submitted with UTR: ${cleanUtr}. Remaining ₹${codBalanceDue} due on delivery.`
              : `PhonePe UPI transaction submitted with UTR/Ref: ${cleanUtr}. Awaiting admin verification.`,
          },
        ],
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const confirmedOrder = {
        id: orderId,
        orderId,
        orderNumber: orderNumber || "",
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        items: (items || []).map((item) => ({
          id: item.id || item.productId || "",
          productId: item.id || item.productId || "",
          title: item.title || "Item",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          selectedSize: item.selectedSize || "M",
          selectedColor: item.selectedColor || "",
          image: item.image || "",
        })),
        subtotal: Number(fullOrderValue),
        discount: 0,
        shipping: 0,
        total: Number(fullOrderValue),
        totalAmount: Number(fullOrderValue),
        advanceAmount: isCod ? Number(amount) : Number(fullOrderValue),
        codBalanceDue: isCod ? Number(codBalanceDue) : 0,
        status: isCod ? "Processing" : "Order Confirmed",
        paymentMethod: isCod ? "cod_partial" : "PhonePe UPI",
        paymentStatus: isCod ? "advance_submitted" : "Paid",
        shippingAddress: {
          fullName: customerName,
          name: customerName,
          email: customerEmail || "",
          phone: customerPhone,
          street: (shippingAddress as any)?.street || "",
          apartment: (shippingAddress as any)?.apartment || "",
          city: (shippingAddress as any)?.city || "",
          state: (shippingAddress as any)?.state || "",
          postalCode: (shippingAddress as any)?.postalCode || "",
          country: (shippingAddress as any)?.country || "India",
        },
        deliveryDateEstimate: "3-5 Business Days",
        trackingNumber: orderNumber || `NXT-${orderId.slice(-6).toUpperCase()}`,
        upiTransactionId: cleanUtr,
      };

      try {
        sessionStorage.setItem("last_confirmed_order", JSON.stringify(confirmedOrder));
      } catch (err) {
        console.warn("sessionStorage write error:", err);
      }

      // Cleanup redirect trackers
      sessionStorage.removeItem("phonepe_order");
      sessionStorage.removeItem("phonepe_redirected_at");
      localStorage.removeItem("phonepe_order");
      localStorage.removeItem("phonepe_redirected_at");

      setShowReturnModal(false);
      setStep("submitted");
      onSuccess?.(orderId, cleanUtr, orderNumber || "", confirmedOrder);
    } catch (e: any) {
      console.error("Failed to submit transaction UTR:", e);
      const msg = "Couldn't submit your transaction ID. Please check your connection and try again.";
      setError(msg);
      setModalError(msg);
    } finally {
      setBusy(false);
    }
  }

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(PAYEE_VPA);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(Number(amount).toFixed(2));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  const handlePasteUtr = async (target: "main" | "modal") => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const cleaned = text.trim();
          setUtr(cleaned);
          setModalUtr(cleaned);
        }
      }
    } catch {
      // Clipboard read permission might be denied
    }
  };

  // Re-open PhonePe app on mobile or prompt for payment
  const handleRetryPayment = () => {
    markRedirect();
    setShowReturnModal(false);
    if (phonepeLink && isMobile()) {
      window.location.href = phonepeLink;
    }
  };

  if (step === "submitted") {
    return (
      <div
        style={{
          borderRadius: "14px",
          border: "1px solid #B7E4C7",
          backgroundColor: "#F0FDF4",
          padding: "24px",
          color: "#166534",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <CheckCircle2 size={40} color="#16A34A" />
        </div>
        <h4 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "6px", color: "#14532D" }}>
          {isCod ? "COD Order Confirmed with ₹149 Advance!" : "Payment Details Received!"}
        </h4>
        <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#166534", maxWidth: "440px", margin: "0 auto 16px" }}>
          Thank you! We&apos;ve received your transaction reference (<strong>{utr || modalUtr}</strong>).
          {isCod
            ? ` Your package will be dispatched soon. Please keep ₹${codBalanceDue.toFixed(2)} ready in cash for the delivery partner.`
            : " Our concierge will verify the deposit and confirm your order dispatch shortly."}
        </p>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 800,
            color: "#15803D",
            fontFamily: "monospace",
            backgroundColor: "#DCFCE7",
            padding: "8px 18px",
            borderRadius: "8px",
            display: "inline-block",
          }}
        >
          Order #: {orderNumber || orderId}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Return from PhonePe Modal Popup */}
      {showReturnModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "18px",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              border: "1px solid rgba(0,0,0,0.08)",
              position: "relative",
              padding: "26px",
            }}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowReturnModal(false);
                sessionStorage.removeItem("phonepe_redirected_at");
                localStorage.removeItem("phonepe_redirected_at");
              }}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                background: "#F3F4F6",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#4B5563",
              }}
              title="Close"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  backgroundColor: "#5F259F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: "16px",
                  flexShrink: 0,
                }}
              >
                पे
              </div>
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#5F259F",
                    display: "block",
                  }}
                >
                  PhonePe Payment Verification
                </span>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#111110" }}>
                  Order #{orderNumber || orderId} • ₹{Number(amount).toFixed(2)}
                </div>
              </div>
            </div>

            {/* MODAL VIEW 1: DID YOU PAY? YES OR NO */}
            {modalStep === "ask_paid" && (
              <div>
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "#FAF5FF",
                    borderRadius: "14px",
                    border: "1px solid #E9D5FF",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#3B0764",
                      marginBottom: "6px",
                    }}
                  >
                    Did you complete your payment on PhonePe?
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#6B21A8",
                      lineHeight: "1.5",
                      margin: "0 auto",
                      maxWidth: "400px",
                    }}
                  >
                    We redirected you to PhonePe to pay <strong>₹{Number(amount).toFixed(2)}</strong>.
                    Please let us know your status so we can immediately confirm and process your shipment.
                  </p>
                </div>

                {/* Yes or No Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setModalStep("enter_utr");
                      setModalError(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "15px 20px",
                      borderRadius: "12px",
                      backgroundColor: "#16A34A",
                      color: "#FFFFFF",
                      fontSize: "15px",
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      boxShadow: "0 4px 14px rgba(22, 163, 74, 0.25)",
                    }}
                  >
                    <CheckCircle2 size={20} />
                    <span>Yes, I Have Paid ₹{Number(amount).toFixed(2)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalStep("not_paid");
                      setModalError(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "13px 20px",
                      borderRadius: "12px",
                      backgroundColor: "#FFFFFF",
                      color: "#4B5563",
                      fontSize: "14px",
                      fontWeight: 700,
                      border: "1px solid #D1D5DB",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <XCircle size={18} color="#9CA3AF" />
                    <span>No, Not Yet / Payment Incomplete</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODAL VIEW 2: ENTER TRANSACTION ID / UTR & WHERE TO FIND IT */}
            {modalStep === "enter_utr" && (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: 800,
                      color: "#111110",
                      marginBottom: "4px",
                    }}
                  >
                    Enter 12-Digit Transaction ID / UTR
                  </h3>
                  <p style={{ fontSize: "12.5px", color: "#6B7280", margin: 0, lineHeight: "1.4" }}>
                    Copy the 12-digit UTR or Transaction ID from your payment receipt and paste it below.
                  </p>
                </div>

                {/* UTR Input Box */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "8px", position: "relative" }}>
                    <input
                      type="text"
                      value={modalUtr}
                      onChange={(e) => {
                        setModalUtr(e.target.value);
                        setUtr(e.target.value);
                        setModalError(null);
                      }}
                      placeholder="e.g. 432198765432 or T2611..."
                      style={{
                        flex: 1,
                        padding: "13px 14px",
                        borderRadius: "10px",
                        border: modalError ? "1.5px solid #EF4444" : "1.5px solid #5F259F",
                        fontSize: "16px",
                        fontFamily: "monospace",
                        outline: "none",
                        backgroundColor: "#FAF9F6",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteUtr("modal")}
                      style={{
                        padding: "0 16px",
                        backgroundColor: "#F3F4F6",
                        border: "1px solid #D1D5DB",
                        borderRadius: "10px",
                        color: "#374151",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                      }}
                      title="Paste from clipboard"
                    >
                      <ClipboardPaste size={15} />
                      <span>Paste</span>
                    </button>
                  </div>

                  {modalError && (
                    <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px", fontWeight: 600 }}>
                      {modalError}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={() => handleSubmitTransaction(undefined, modalUtr)}
                  disabled={busy}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: "10px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    fontSize: "14.5px",
                    fontWeight: 800,
                    border: "none",
                    cursor: busy ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "18px",
                  }}
                >
                  {busy ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying & Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm Order & Submit Payment</span>
                    </>
                  )}
                </button>

                {/* WHERE CAN I FIND TRANSACTION ID? GUIDE (Crucial User Requirement) */}
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#FAF9F6",
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 800,
                      color: "#111110",
                      marginBottom: "10px",
                    }}
                  >
                    <HelpCircle size={15} color="#5F259F" />
                    <span>Where to find your Transaction ID / UTR:</span>
                  </div>

                  {/* App Tabs */}
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      marginBottom: "12px",
                      overflowX: "auto",
                      paddingBottom: "2px",
                    }}
                  >
                    {[
                      { id: "phonepe", label: "PhonePe" },
                      { id: "gpay", label: "Google Pay" },
                      { id: "paytm", label: "Paytm" },
                      { id: "sms", label: "Bank SMS" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setGuideTab(tab.id as any)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "9999px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: guideTab === tab.id ? "#5F259F" : "#E5E7EB",
                          color: guideTab === tab.id ? "#FFFFFF" : "#4B5563",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Instruction Content */}
                  <div style={{ fontSize: "12px", color: "#4B5563", lineHeight: "1.6" }}>
                    {guideTab === "phonepe" && (
                      <div>
                        <div style={{ marginBottom: "6px" }}>
                          1. Open the <strong>PhonePe</strong> app.
                        </div>
                        <div style={{ marginBottom: "6px" }}>
                          2. Tap <strong>History</strong> (bottom right icon).
                        </div>
                        <div style={{ marginBottom: "6px" }}>
                          3. Tap on the latest payment to <strong>{PAYEE_NAME}</strong>.
                        </div>
                        <div>
                          4. Under <strong>Transfer Details</strong>, look for <strong>UTR</strong> (12 digits, e.g. <span style={{ fontFamily: "monospace", backgroundColor: "#EDE9FE", padding: "1px 5px", borderRadius: "4px", color: "#5F259F" }}>432198765432</span>) or <strong>Transaction ID</strong> (starting with <span style={{ fontFamily: "monospace", backgroundColor: "#EDE9FE", padding: "1px 5px", borderRadius: "4px", color: "#5F259F" }}>T2611...</span>).
                        </div>
                      </div>
                    )}

                    {guideTab === "gpay" && (
                      <div>
                        <div style={{ marginBottom: "6px" }}>
                          1. Open <strong>Google Pay</strong>.
                        </div>
                        <div style={{ marginBottom: "6px" }}>
                          2. Scroll to the bottom &amp; tap <strong>Show transaction history</strong>.
                        </div>
                        <div style={{ marginBottom: "6px" }}>
                          3. Tap the payment to <strong>{PAYEE_NAME}</strong>.
                        </div>
                        <div>
                          4. Scroll down and copy the 12-digit <strong>UPI transaction ID</strong> (e.g. <span style={{ fontFamily: "monospace", backgroundColor: "#E0F2FE", padding: "1px 5px", borderRadius: "4px", color: "#0369A1" }}>432109876543</span>).
                        </div>
                      </div>
                    )}

                    {guideTab === "paytm" && (
                      <div>
                        <div style={{ marginBottom: "6px" }}>
                          1. Open <strong>Paytm</strong>.
                        </div>
                        <div style={{ marginBottom: "6px" }}>
                          2. Tap <strong>Balance &amp; History</strong>.
                        </div>
                        <div style={{ marginBottom: "6px" }}>
                          3. Tap on the payment receipt.
                        </div>
                        <div>
                          4. Look for the 12-digit <strong>UPI Ref No.</strong> (e.g. <span style={{ fontFamily: "monospace", backgroundColor: "#EFF6FF", padding: "1px 5px", borderRadius: "4px", color: "#1D4ED8" }}>432109876543</span>).
                        </div>
                      </div>
                    )}

                    {guideTab === "sms" && (
                      <div>
                        <div style={{ marginBottom: "6px" }}>
                          1. Open your phone&apos;s <strong>Messages / SMS app</strong>.
                        </div>
                        <div style={{ marginBottom: "6px" }}>
                          2. Look for the debit SMS from your bank (e.g. HDFC, SBI, ICICI, Axis).
                        </div>
                        <div>
                          3. The SMS mentions: <em>&quot;A/c debited by Rs. {amount} ... UPI Ref: <span style={{ fontFamily: "monospace", backgroundColor: "#FEF3C7", padding: "1px 5px", borderRadius: "4px", color: "#92400E" }}>432109876543</span>&quot;</em>.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Link */}
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setModalStep("ask_paid")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6B7280",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 600,
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>Change Answer (Didn&apos;t pay yet?)</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODAL VIEW 3: PAYMENT NOT COMPLETED */}
            {modalStep === "not_paid" && (
              <div>
                <div
                  style={{
                    padding: "20px",
                    backgroundColor: "#FEF2F2",
                    borderRadius: "14px",
                    border: "1px solid #FECACA",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "#FEE2E2",
                      color: "#DC2626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px auto",
                    }}
                  >
                    <RefreshCw size={22} />
                  </div>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: 800,
                      color: "#991B1B",
                      marginBottom: "6px",
                    }}
                  >
                    Payment Not Completed
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#B91C1C",
                      lineHeight: "1.5",
                      margin: 0,
                    }}
                  >
                    No worries! Your cart items and shipping details are safe.
                    Would you like to retry paying via PhonePe or choose another option?
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={handleRetryPayment}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      backgroundColor: "#5F259F",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(95, 37, 159, 0.25)",
                    }}
                  >
                    <Smartphone size={16} />
                    <span>Retry Payment with PhonePe (₹{Number(amount).toFixed(2)})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowReturnModal(false);
                      sessionStorage.removeItem("phonepe_redirected_at");
                      localStorage.removeItem("phonepe_redirected_at");
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      backgroundColor: "#FFFFFF",
                      color: "#374151",
                      fontSize: "13px",
                      fontWeight: 700,
                      border: "1px solid #D1D5DB",
                      cursor: "pointer",
                    }}
                  >
                    Return to Checkout &amp; Change Method
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStep("enter_utr")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#16A34A",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "6px",
                    }}
                  >
                    Wait, I actually paid! Let me enter my Transaction ID →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Idle state */}
      {step === "idle" && (
        <div>
          {/* Summary Box */}
          <div
            style={{
              padding: "16px 18px",
              backgroundColor: isCod ? "#F7F5F0" : "#FAF5FF",
              borderRadius: "10px",
              border: isCod ? "1px solid #E5E0D5" : "1px solid #E9D5FF",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: isCod ? "#111110" : "#5F259F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: "15px",
                }}
              >
                {isCod ? <Banknote size={18} /> : "पे"}
              </div>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                  {isCod ? "Cash on Delivery (₹149 Advance)" : "Instant PhonePe & UPI"}
                </div>
                <div style={{ fontSize: "11.5px", color: "#6B7280" }}>
                  {isCod
                    ? `Pay ₹${amount} now via UPI · Pay remaining ₹${codBalanceDue.toFixed(2)} in cash on delivery`
                    : `Direct app redirect on mobile · Scan PhonePe QR to pay ${PAYEE_NAME}`}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "#6B7280", display: "block" }}>
                {isCod ? "Payable Now" : "Total Due"}
              </span>
              <span style={{ fontSize: "16px", fontWeight: 900, color: isCod ? "#111110" : "#5F259F" }}>
                ₹{Number(amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            type="button"
            onClick={handlePay}
            disabled={busy}
            style={{
              width: "100%",
              padding: "15px 22px",
              borderRadius: "10px",
              backgroundColor: isCod ? "#111110" : "#5F259F",
              color: "#FFFFFF",
              fontSize: "14.5px",
              fontWeight: 800,
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: isCod ? "0 4px 14px rgba(0,0,0,0.18)" : "0 4px 14px rgba(95, 37, 159, 0.25)",
              transition: "transform 0.15s ease, background-color 0.15s ease",
            }}
          >
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generating UPI Payment...</span>
              </>
            ) : isCod ? (
              <>
                <Smartphone size={18} />
                <span>Pay ₹149 Advance &amp; Place COD Order</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <Smartphone size={18} />
                <span>Pay ₹{Number(amount).toFixed(2)} with PhonePe UPI</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Order Created - Show Official PhonePe QR & UTR Form */}
      {step === "created" && (
        <div
          style={{
            borderRadius: "14px",
            border: "1px solid #E5E7EB",
            backgroundColor: "#FFFFFF",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #F3F4F6",
              paddingBottom: "14px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#936037",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "block",
                }}
              >
                Order #{orderNumber || orderId}
              </span>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#111110" }}>
                {isCod ? "Pay ₹149 COD Advance" : "PhonePe & UPI Payment"}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "#6B7280", display: "block" }}>Amount to Pay</span>
              <span style={{ fontSize: "18px", fontWeight: 900, color: "#5F259F" }}>
                ₹{Number(amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Returned from PhonePe Trigger Banner */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#FAF5FF",
              borderRadius: "10px",
              border: "1px solid #E9D5FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Smartphone size={16} color="#5F259F" />
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#3B0764" }}>
                Did you complete the payment on PhonePe?
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowReturnModal(true);
                setModalStep("ask_paid");
              }}
              style={{
                backgroundColor: "#5F259F",
                color: "#FFFFFF",
                padding: "6px 14px",
                borderRadius: "9999px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Verify Payment Status
            </button>
          </div>

          {/* COD Notice if applicable */}
          {isCod && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: "#FEF3C7",
                border: "1px solid #FDE68A",
                fontSize: "12px",
                color: "#92400E",
                lineHeight: "1.5",
              }}
            >
              <strong>COD Breakdown:</strong> Paying ₹149 advance now via UPI confirms your order. The remaining balance of <strong>₹{codBalanceDue.toFixed(2)}</strong> will be collected in cash upon doorstep delivery.
            </div>
          )}

          {/* PhonePe Merchant QR Code Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "20px",
              backgroundColor: "#FAF9F6",
              borderRadius: "14px",
              border: "1px dashed #D1D5DB",
              gap: "14px",
            }}
          >
            {/* Mode switch tabs: Official Standee QR vs Auto-Amount Dynamic QR */}
            <div
              style={{
                display: "inline-flex",
                padding: "3px",
                backgroundColor: "#F3F4F6",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: 700,
                border: "1px solid #E5E7EB",
              }}
            >
              <button
                type="button"
                onClick={() => setQrMode("phonepe_standee")}
                style={{
                  padding: "5px 14px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: qrMode === "phonepe_standee" ? "#5F259F" : "transparent",
                  color: qrMode === "phonepe_standee" ? "#FFFFFF" : "#4B5563",
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                }}
              >
                PhonePe Standee QR
              </button>

              <button
                type="button"
                onClick={() => setQrMode("dynamic")}
                style={{
                  padding: "5px 14px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: qrMode === "dynamic" ? "#5F259F" : "transparent",
                  color: qrMode === "dynamic" ? "#FFFFFF" : "#4B5563",
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                }}
              >
                Auto-Amount QR (₹{Number(amount).toFixed(2)})
              </button>
            </div>

            {/* QR Code Container */}
            <div
              style={{
                padding: "16px",
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {qrMode === "phonepe_standee" ? (
                <div
                  style={{
                    width: "210px",
                    height: "210px",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "8px",
                  }}
                >
                  <img
                    src={QR_IMAGE}
                    alt="PhonePe UPI QR Code"
                    width={210}
                    height={210}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.src.includes("sirv.com")) {
                        target.src = "https://nxtiveclothing.sirv.com/IMG_0057.JPG.jpeg";
                      }
                    }}
                  />
                </div>
              ) : (
                genericLink && (
                  <QRCodeSVG
                    value={genericLink}
                    size={210}
                    level="M"
                    includeMargin={true}
                  />
                )
              )}
            </div>

            <div>
              <p style={{ fontSize: "14px", fontWeight: 800, color: "#111110", marginBottom: "3px" }}>
                Scan with PhonePe or Any UPI App
              </p>
              <p style={{ fontSize: "12px", color: "#6B7280", maxWidth: "360px", margin: "0 auto" }}>
                Payee: <strong>{PAYEE_NAME}</strong> · Amount: <strong>₹{Number(amount).toFixed(2)}</strong>
              </p>
            </div>

            {/* Quick copy bar */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                type="button"
                onClick={handleCopyVpa}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "1px solid #D1D5DB",
                  backgroundColor: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: copiedVpa ? "#16A34A" : "#111110",
                  cursor: "pointer",
                }}
              >
                <Copy size={12} />
                <span>{copiedVpa ? "UPI ID Copied!" : `Copy UPI: ${PAYEE_VPA}`}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAmount}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "1px solid #D1D5DB",
                  backgroundColor: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: copiedAmount ? "#16A34A" : "#111110",
                  cursor: "pointer",
                }}
              >
                <Copy size={12} />
                <span>{copiedAmount ? "Amount Copied!" : `Copy Amount: ₹${Number(amount).toFixed(2)}`}</span>
              </button>
            </div>

            {/* Supported apps badges */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "4px", backgroundColor: "#EDE9FE", color: "#5F259F" }}>PhonePe</span>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "4px", backgroundColor: "#E0F2FE", color: "#0369A1" }}>Google Pay</span>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "4px", backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>Paytm</span>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "4px", backgroundColor: "#ECFDF5", color: "#047857" }}>BHIM / CRED</span>
            </div>
          </div>

          {/* Mobile Direct Tap Links */}
          {isMobileDevice && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "6px 0" }}>
              {phonepeLink && (
                <a
                  href={phonepeLink}
                  onClick={markRedirect}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: "10px",
                    backgroundColor: "#5F259F",
                    color: "#FFFFFF",
                    fontSize: "14.5px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 3px 10px rgba(95, 37, 159, 0.25)",
                  }}
                >
                  <Smartphone size={18} />
                  <span>Tap to Pay with PhonePe (₹{Number(amount).toFixed(2)})</span>
                  <ExternalLink size={15} />
                </a>
              )}

              {genericLink && (
                <a
                  href={genericLink}
                  onClick={markRedirect}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "13px 18px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    color: "#111110",
                    border: "1px solid rgba(0,0,0,0.18)",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <QrCode size={16} />
                  <span>Pay with GPay / Paytm / Other UPI</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}

          {/* Action: Submit UTR / Transaction ID */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              borderTop: "1px solid #F3F4F6",
              paddingTop: "16px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <label
                  htmlFor="phonepe-utr-input"
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#111110",
                  }}
                >
                  Enter 12-Digit UPI Transaction ID / UTR
                </label>
                <button
                  type="button"
                  onClick={() => setShowInlineGuide(!showInlineGuide)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#5F259F",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <HelpCircle size={13} />
                  <span>{showInlineGuide ? "Hide Guide" : "Where to find UTR?"}</span>
                </button>
              </div>

              <span style={{ fontSize: "11.5px", color: "#6B7280", display: "block", marginBottom: "8px" }}>
                Once paid, copy the 12-digit UTR from PhonePe, Google Pay, or Paytm payment receipt.
              </span>

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  id="phonepe-utr-input"
                  type="text"
                  value={utr}
                  onChange={(e) => {
                    setUtr(e.target.value);
                    setModalUtr(e.target.value);
                  }}
                  placeholder="e.g. 432198765432 or T26110..."
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    fontSize: "16px",
                    fontFamily: "monospace",
                    outline: "none",
                    backgroundColor: "#FAF9F6",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handlePasteUtr("main")}
                  style={{
                    padding: "0 14px",
                    backgroundColor: "#F3F4F6",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    color: "#374151",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                  title="Paste from clipboard"
                >
                  <ClipboardPaste size={14} />
                  <span>Paste</span>
                </button>
              </div>
            </div>

            {/* Inline Guide (Where to find UTR) */}
            {showInlineGuide && (
              <div
                style={{
                  padding: "14px 16px",
                  backgroundColor: "#FAF9F6",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  fontSize: "12px",
                  color: "#4B5563",
                  lineHeight: "1.5",
                }}
              >
                <div style={{ fontWeight: 800, color: "#111110", marginBottom: "6px" }}>
                  How to find your 12-Digit UTR:
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                  <li>
                    <strong>PhonePe:</strong> Open History &gt; Tap payment to {PAYEE_NAME} &gt; Look for <strong>UTR</strong> or <strong>Transaction ID</strong>.
                  </li>
                  <li>
                    <strong>Google Pay:</strong> Tap transaction &gt; Look for 12-digit <strong>UPI transaction ID</strong>.
                  </li>
                  <li>
                    <strong>Paytm:</strong> Balance &amp; History &gt; Tap payment &gt; Copy <strong>UPI Ref No.</strong>
                  </li>
                  <li>
                    <strong>Bank SMS:</strong> Check the SMS received after payment for <strong>&quot;UPI Ref&quot;</strong>.
                  </li>
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmitTransaction}
              disabled={busy}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 800,
                border: "none",
                cursor: busy ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Confirming Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm Order &amp; Submit Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#B91C1C",
            fontSize: "12.5px",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default PhonePeCheckout;
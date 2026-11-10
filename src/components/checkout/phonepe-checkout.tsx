"use client";

// components/checkout/phonepe-checkout.tsx
//
// Direct PhonePe UPI & Universal UPI QR Checkout Component.
// Flow:
//   1. Customer taps "Pay with PhonePe" (or "Pay ₹149 Advance for COD") ->
//      creates Firestore order with formatted NXTIVE order number and displays
//      a 100% compliant NPCI UPI QR code (official PhonePe merchant standee QR cropped clean)
//      + deep-links for PhonePe/GPay/Paytm.
//   2. Customer scans QR or pays in app, pastes transaction ID/UTR -> order marked submitted.
//   3. Admin verifies transaction in PhonePe Business / bank statement.

import React, { useEffect, useState } from "react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Banknote,
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

  const fullOrderValue = totalOrderAmount && totalOrderAmount > 0 ? totalOrderAmount : amount;
  const codBalanceDue = isCod ? Math.max(0, fullOrderValue - amount) : 0;

  // Detect mobile device
  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  // Resume in-progress order if customer reloads tab
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("phonepe_order");
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
      // Ignore sessionStorage parsing errors
    }
  }, [amount]);

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

      sessionStorage.setItem(
        "phonepe_order",
        JSON.stringify({
          orderId: ref.id,
          orderNumber: generatedOrderNumber,
          amount,
          phonepeLink: ppLink,
          genericLink: upiLink,
        })
      );

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

  async function handleSubmitTransaction(e?: React.FormEvent | React.MouseEvent) {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    const cleanUtr = utr.trim();
    if (!cleanUtr) {
      setError("Please enter the transaction ID or 12-digit UTR shown in PhonePe / your UPI app after paying.");
      return;
    }
    if (!orderId) {
      setError("Active order not found. Please click 'Pay with PhonePe' again.");
      return;
    }

    setBusy(true);
    setError(null);
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

      sessionStorage.removeItem("phonepe_order");
      setStep("submitted");
      onSuccess?.(orderId, cleanUtr, orderNumber || "", confirmedOrder);
    } catch (e: any) {
      console.error("Failed to submit transaction UTR:", e);
      setError("Couldn't submit your transaction ID. Please check your connection and try again.");
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
          Thank you! We've received your transaction reference (<strong>{utr}</strong>).
          {isCod
            ? ` Your package will be dispatched soon. Please keep ₹${codBalanceDue} ready in cash for the delivery partner.`
            : " Our concierge will verify the deposit and confirm your order dispatch shortly."}
        </p>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "#15803D", fontFamily: "monospace", backgroundColor: "#DCFCE7", padding: "8px 18px", borderRadius: "8px", display: "inline-block" }}>
          Order #: {orderNumber || orderId}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                    ? `Pay ₹${amount} now via UPI · Pay remaining ₹${codBalanceDue} in cash on delivery`
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
                <span>Pay ₹149 Advance & Place COD Order</span>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#936037", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
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

          {/* COD Notice if applicable */}
          {isCod && (
            <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "#FEF3C7", border: "1px solid #FDE68A", fontSize: "12px", color: "#92400E", lineHeight: "1.5" }}>
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
                /* The clean cropped PhonePe QR requested by user (only QR portion shown) */
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
                      // Fallback to Sirv URL if local image has issues
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.src.includes("sirv.com")) {
                        target.src = "https://nxtiveclothing.sirv.com/IMG_0057.JPG.jpeg";
                      }
                    }}
                  />
                </div>
              ) : (
                /* Dynamic NPCI standard QR with order amount and note */
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
              <label
                htmlFor="phonepe-utr-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#111110",
                  marginBottom: "4px",
                }}
              >
                Enter 12-Digit UPI Transaction ID / UTR
              </label>
              <span style={{ fontSize: "11.5px", color: "#6B7280", display: "block", marginBottom: "8px" }}>
                Once paid, copy the 12-digit UTR from PhonePe, Google Pay, or Paytm payment receipt.
              </span>
              <input
                id="phonepe-utr-input"
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 432198765432 or T26110..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  outline: "none",
                  backgroundColor: "#FAF9F6",
                }}
              />
            </div>

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
                  <span>Confirm Order & Submit Payment</span>
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

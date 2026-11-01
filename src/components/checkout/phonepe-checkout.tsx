"use client";

// components/checkout/phonepe-checkout.tsx
//
// Direct PhonePe UPI Checkout Component.
// Flow:
//   1. Customer taps "Pay with PhonePe" -> creates a Firestore order
//      (status: "pending") and redirects to phonepe://pay (mobile) or shows
//      a QR code built from the same link (desktop).
//   2. Customer pays in the PhonePe app, comes back, pastes the transaction
//      ID / UTR PhonePe gave them -> order becomes "submitted".
//   3. Admin checks the real payment in their PhonePe Business app / bank
//      statement and marks it "verified" from the admin panel.

import React, { useEffect, useState } from "react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, CheckCircle2, Copy, ExternalLink, HelpCircle, Loader2, QrCode, ShieldCheck, Smartphone } from "lucide-react";
import { db } from "@/lib/firebase";
import { buildPhonePeLink, buildGenericUpiLink, isMobile } from "@/lib/upi";

export interface PhonePeCheckoutProps {
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: any;
  items?: any[];
  onSuccess?: (orderId: string, utr: string) => void;
  onError?: (err: string) => void;
}

const PAYEE_VPA = process.env.NEXT_PUBLIC_PHONEPE_VPA || "nxtive@ybl";
const PAYEE_NAME = process.env.NEXT_PUBLIC_PHONEPE_NAME || "NXTIVE Menswear";

export function PhonePeCheckout({
  amount,
  customerName,
  customerPhone,
  customerEmail,
  shippingAddress,
  items,
  onSuccess,
  onError,
}: PhonePeCheckoutProps) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [phonepeLink, setPhonepeLink] = useState<string | null>(null);
  const [genericLink, setGenericLink] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "created" | "submitted">("idle");
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  // Resume an in-progress order if the customer reloads/returns to the tab after paying in PhonePe
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("phonepe_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orderId && parsed.amount === amount) {
          setOrderId(parsed.orderId);
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
      // 1. Create order in Firestore
      // Adheres strictly to firestore.rules keys:
      // customerName, customerPhone, amount, status, paymentMethod, upiTransactionId, createdAt
      const orderPayload: Record<string, any> = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        amount: Number(amount),
        status: "pending", // pending -> submitted -> verified / rejected
        paymentMethod: "phonepe_manual",
        upiTransactionId: null,
        createdAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, "orders"), orderPayload);

      const linkArgs = {
        payeeVpa: PAYEE_VPA,
        payeeName: PAYEE_NAME,
        amount,
        orderId: ref.id,
      };
      const ppLink = buildPhonePeLink(linkArgs);
      const upiLink = buildGenericUpiLink(linkArgs);

      sessionStorage.setItem(
        "phonepe_order",
        JSON.stringify({
          orderId: ref.id,
          amount,
          phonepeLink: ppLink,
          genericLink: upiLink,
        })
      );

      setOrderId(ref.id);
      setPhonepeLink(ppLink);
      setGenericLink(upiLink);
      setStep("created");

      // Mobile redirect: Opens the PhonePe app directly
      if (isMobile()) {
        window.location.href = ppLink;
      }
    } catch (e: any) {
      console.error("PhonePe order creation failed:", e);
      const errorMsg = e?.message || "Couldn't initiate PhonePe payment. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitTransaction(e: React.FormEvent) {
    e.preventDefault();
    const cleanUtr = utr.trim();
    if (!cleanUtr) {
      setError("Please enter the transaction ID or 12-digit UTR shown in PhonePe after paying.");
      return;
    }
    if (!orderId) {
      setError("Active order not found. Please click 'Pay with PhonePe' again.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      // Update order in Firestore with UTR and status 'submitted'
      await updateDoc(doc(db, "orders", orderId), {
        upiTransactionId: cleanUtr,
        status: "submitted",
        submittedAt: serverTimestamp(),
      });

      sessionStorage.removeItem("phonepe_order");
      setStep("submitted");
      onSuccess?.(orderId, cleanUtr);
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

  if (step === "submitted") {
    return (
      <div
        style={{
          borderRadius: "12px",
          border: "1px solid #B7E4C7",
          backgroundColor: "#F0FDF4",
          padding: "24px",
          color: "#166534",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <CheckCircle2 size={36} color="#16A34A" />
        </div>
        <h4 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "6px", color: "#14532D" }}>
          Payment Details Received!
        </h4>
        <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#166534", maxWidth: "420px", margin: "0 auto 16px" }}>
          Thank you! We've received your PhonePe transaction ID (<strong>{utr}</strong>).
          Our concierge will verify the deposit and confirm your order dispatch shortly.
        </p>
        <div style={{ fontSize: "12px", color: "#15803D", fontFamily: "monospace", backgroundColor: "#DCFCE7", padding: "6px 14px", borderRadius: "6px", display: "inline-block" }}>
          Order ID: {orderId}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Step 1: Idle state */}
      {step === "idle" && (
        <div>
          <div
            style={{
              padding: "16px 18px",
              backgroundColor: "#FAF5FF",
              borderRadius: "10px",
              border: "1px solid #E9D5FF",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: "#5F259F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: "15px",
                }}
              >
                पे
              </div>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                  Instant PhonePe UPI
                </div>
                <div style={{ fontSize: "11.5px", color: "#6B7280" }}>
                  Direct app redirect on mobile · Scan QR on desktop
                </div>
              </div>
            </div>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#5F259F" }}>
              ₹{Number(amount).toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={busy}
            style={{
              width: "100%",
              padding: "15px 22px",
              borderRadius: "10px",
              backgroundColor: "#5F259F",
              color: "#FFFFFF",
              fontSize: "14.5px",
              fontWeight: 800,
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 4px 14px rgba(95, 37, 159, 0.25)",
              transition: "transform 0.15s ease, background-color 0.15s ease",
            }}
          >
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Opening PhonePe...</span>
              </>
            ) : (
              <>
                <Smartphone size={18} />
                <span>Pay ₹{Number(amount).toFixed(2)} with PhonePe</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Order Created - Show QR Code / App Link & UTR Form */}
      {step === "created" && (
        <div
          style={{
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            backgroundColor: "#FFFFFF",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: "#5F259F", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "13px", fontWeight: 800 }}>
                पे
              </div>
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                PhonePe Payment Request
              </span>
            </div>
            <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#111110" }}>
              ₹{Number(amount).toFixed(2)}
            </span>
          </div>

          {/* Desktop: QR Code */}
          {!isMobileDevice && phonepeLink && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "16px",
                backgroundColor: "#F9FAFB",
                borderRadius: "10px",
                border: "1px dashed #D1D5DB",
                gap: "12px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
                <QRCodeSVG value={phonepeLink} size={200} level="M" />
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#111110", marginBottom: "4px" }}>
                  Scan with the PhonePe App to Pay
                </p>
                <p style={{ fontSize: "12px", color: "#6B7280" }}>
                  Open PhonePe on your mobile phone, tap the QR scanner icon, and complete payment.
                </p>
              </div>
            </div>
          )}

          {/* Mobile Direct Tap Link */}
          {isMobileDevice && phonepeLink && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
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
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(95, 37, 159, 0.2)",
                }}
              >
                <Smartphone size={18} />
                <span>Tap to Open PhonePe App</span>
                <ExternalLink size={15} />
              </a>
              <span style={{ fontSize: "11.5px", color: "#6B7280", marginTop: "6px", display: "block" }}>
                PhonePe didn't open automatically? Tap the button above.
              </span>
            </div>
          )}

          {/* Fallback UPI Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#4B5563" }}>
              <span>Payee UPI ID: <strong>{PAYEE_VPA}</strong></span>
              <button
                type="button"
                onClick={handleCopyVpa}
                style={{
                  background: "none",
                  border: "none",
                  color: copiedVpa ? "#16A34A" : "#5F259F",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Copy size={12} />
                <span>{copiedVpa ? "Copied!" : "Copy UPI ID"}</span>
              </button>
            </div>

            {genericLink && (
              <a
                href={genericLink}
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#6B7280",
                  textDecoration: "underline",
                  marginTop: "4px",
                }}
              >
                Don't have PhonePe? Pay with any other UPI app (GPay / Paytm / CRED)
              </a>
            )}
          </div>

          {/* Form: Submit UTR / Transaction ID */}
          <form
            onSubmit={handleSubmitTransaction}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              borderTop: "1px solid #F3F4F6",
              paddingTop: "14px",
            }}
          >
            <div>
              <label
                htmlFor="phonepe-utr-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#111110",
                  marginBottom: "4px",
                }}
              >
                Already paid? Enter PhonePe Transaction ID / UTR
              </label>
              <span style={{ fontSize: "11.5px", color: "#6B7280", display: "block", marginBottom: "8px" }}>
                Find this in your PhonePe app under Payment Details (e.g. <code>T261101...</code> or 12-digit UTR).
              </span>
              <input
                id="phonepe-utr-input"
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. T2611012345678912 or 432198765432"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  fontSize: "13.5px",
                  fontFamily: "monospace",
                  outline: "none",
                  backgroundColor: "#FAF9F6",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "8px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                fontSize: "13.5px",
                fontWeight: 700,
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
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Confirm & Submit Order</span>
              )}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#B91C1C",
            fontSize: "12.5px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default PhonePeCheckout;

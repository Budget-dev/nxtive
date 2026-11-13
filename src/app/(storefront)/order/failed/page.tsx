"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  XCircle,
  RefreshCw,
  ShoppingBag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

function OrderFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const errorParam = searchParams.get("error") || "";

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    getDoc(doc(db, "orders", orderId))
      .then((snap) => {
        if (snap.exists()) setOrderData(snap.data());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const errorMessage =
    errorParam ||
    orderData?.errorDescription ||
    "Your payment could not be completed. No money has been deducted.";

  const amountTotal =
    orderData?.amountTotal ||
    orderData?.total ||
    orderData?.totalAmount ||
    orderData?.amount ||
    0;

  return (
    <div
      style={{
        backgroundColor: "#F5F3ED",
        minHeight: "100vh",
        padding: "60px 20px 80px",
      }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        {/* Failed Header */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "32px 28px",
            textAlign: "center",
            marginBottom: "20px",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          {loading ? (
            <Loader2 size={32} color="#111110" className="animate-spin" style={{ margin: "0 auto" }} />
          ) : (
            <>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#FEF2F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <XCircle size={32} color="#DC2626" />
              </div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#111110",
                  marginBottom: "8px",
                }}
              >
                Payment Failed
              </h1>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "#666",
                  lineHeight: 1.5,
                  marginBottom: "16px",
                }}
              >
                {errorMessage}
              </p>

              {orderId && (
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    backgroundColor: "#F5F3ED",
                    display: "inline-block",
                    fontSize: "12px",
                    color: "#555",
                    fontWeight: 600,
                  }}
                >
                  Order Ref: <span style={{ fontFamily: "monospace", color: "#111110" }}>{orderId}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Safe Money Banner */}
        {!loading && (
          <div
            style={{
              backgroundColor: "#F0FDF4",
              border: "1.5px solid #BBF7D0",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertCircle size={18} color="#15803D" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "12.5px", color: "#166534", fontWeight: 600 }}>
              Your money is safe. No amount has been deducted. You can retry the payment below.
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Retry — go back to checkout with orderId for context */}
            <Link
              href={`/checkout${orderId ? `?retryOrderId=${orderId}` : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px 24px",
                borderRadius: "9999px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 6px 20px rgba(17,17,16,0.15)",
              }}
            >
              <RefreshCw size={16} />
              <span>Retry Payment{amountTotal > 0 ? ` — ₹${amountTotal.toLocaleString("en-IN")}` : ""}</span>
            </Link>
            <Link
              href="/cart"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px 24px",
                borderRadius: "9999px",
                backgroundColor: "#FFFFFF",
                color: "#111110",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                border: "1.5px solid rgba(0,0,0,0.15)",
              }}
            >
              <ShoppingBag size={15} />
              <span>Back to Cart</span>
            </Link>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function OrderFailedPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            backgroundColor: "#F5F3ED",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2 size={32} color="#111110" className="animate-spin" />
        </div>
      }
    >
      <OrderFailedContent />
    </Suspense>
  );
}

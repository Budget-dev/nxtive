"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  Home,
  Loader2,
  Clock,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const paymentId = searchParams.get("paymentId") || "";
  const method = (searchParams.get("method") || "razorpay").toUpperCase();

  const [orderData, setOrderData] = useState<any>(null);
  const [polling, setPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  const MAX_POLLS = 12; // 12 × 2.5s = 30s max
  const POLL_INTERVAL = 2500;

  useEffect(() => {
    if (!orderId) {
      setPolling(false);
      return;
    }

    let cancelled = false;
    let timer: NodeJS.Timeout;

    const fetchOrder = async () => {
      try {
        let data: any = null;

        // 1. Try polling GET /api/orders/:id
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
          if (res.ok) {
            const json = await res.json();
            if (json?.success && json?.data) {
              data = json.data;
            }
          }
        } catch {
          // Ignore network error on static hosting, fallback to Firestore
        }

        // 2. Fallback to direct Firestore getDoc
        if (!data) {
          const snap = await getDoc(doc(db, "orders", orderId));
          if (snap.exists()) {
            data = snap.data();
          }
        }

        if (cancelled) return;

        if (data) {
          setOrderData(data);

          const confirmed =
            data.orderStatus === "CONFIRMED" ||
            data.status === "paid" ||
            data.status === "confirmed" ||
            data.paymentStatus === "paid" ||
            data.paymentStatus === "PAID" ||
            data.paymentStatus === "PARTIALLY_PAID";

          if (confirmed || pollCount >= MAX_POLLS) {
            setPolling(false);
            return;
          }
        } else if (pollCount >= MAX_POLLS) {
          setPolling(false);
          return;
        }
      } catch {
        if (pollCount >= MAX_POLLS) setPolling(false);
      }

      setPollCount((c) => c + 1);
      timer = setTimeout(fetchOrder, POLL_INTERVAL);
    };

    fetchOrder();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, pollCount]);

  const isCOD =
    orderData?.paymentMethod === "COD" ||
    method === "COD";

  const amountTotal =
    orderData?.amountTotal ||
    orderData?.total ||
    orderData?.totalAmount ||
    orderData?.amount ||
    0;

  const amountPaid =
    orderData?.amountPaid !== undefined
      ? orderData.amountPaid
      : isCOD
      ? 149
      : amountTotal;

  const amountDue =
    orderData?.amountDue !== undefined
      ? orderData.amountDue
      : isCOD
      ? amountTotal - amountPaid
      : 0;

  const shippingAddress = orderData?.shippingAddress || {};
  const items: any[] = orderData?.items || [];

  return (
    <div
      style={{
        backgroundColor: "#F5F3ED",
        minHeight: "100vh",
        padding: "60px 20px 80px",
      }}
    >
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        {/* Success Header */}
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
          {polling ? (
            <>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#F0FDF4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Loader2 size={30} color="#2B9348" className="animate-spin" />
              </div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#111110",
                  marginBottom: "8px",
                }}
              >
                Confirming Your Payment
              </h1>
              <p style={{ fontSize: "13.5px", color: "#666", lineHeight: 1.5 }}>
                We&apos;re verifying your payment with Razorpay. This usually
                takes a few seconds…
              </p>
            </>
          ) : (
            <>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#DCFCE7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <CheckCircle2 size={32} color="#2B9348" />
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "#111110",
                  marginBottom: "8px",
                }}
              >
                {isCOD ? "Order Confirmed! 🎉" : "Payment Successful! 🎉"}
              </h1>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "#666",
                  lineHeight: 1.5,
                  marginBottom: "16px",
                }}
              >
                {isCOD
                  ? `Your COD advance of ₹${amountPaid} has been received. The remaining ₹${amountDue.toLocaleString("en-IN")} will be collected on delivery.`
                  : "Your payment has been processed and your order is confirmed."}
              </p>

              {orderId && (
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    backgroundColor: "#F5F3ED",
                    display: "inline-block",
                    fontSize: "12.5px",
                    color: "#555",
                    fontWeight: 600,
                  }}
                >
                  Order ID: <span style={{ color: "#111110", fontFamily: "monospace" }}>{orderId}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* COD Balance Banner */}
        {!polling && isCOD && amountDue > 0 && (
          <div
            style={{
              backgroundColor: "#FFF7ED",
              border: "2px solid #FED7AA",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <Clock size={20} color="#B45309" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#92400E",
                  marginBottom: "4px",
                }}
              >
                Pay on Delivery: ₹{amountDue.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "12px", color: "#B45309", lineHeight: 1.4 }}>
                Keep ₹{amountDue.toLocaleString("en-IN")} ready to pay the delivery person in cash or via UPI at the door.
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        {!polling && items.length > 0 && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "20px",
              marginBottom: "20px",
              border: "1px solid rgba(0,0,0,0.07)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 800,
                textTransform: "uppercase",
                color: "#111110",
                margin: "0 0 14px 0",
                letterSpacing: "0.04em",
              }}
            >
              <Package size={15} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
              Items Ordered ({items.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {items.map((item: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    paddingBottom: i < items.length - 1 ? "10px" : "0",
                    borderBottom: i < items.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        width: "44px",
                        height: "54px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        backgroundColor: "#EAE7DF",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#111110",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#777" }}>
                      Qty: {item.quantity} • Size: {item.selectedSize}
                      {item.selectedColor ? ` • ${item.selectedColor}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#111110" }}>
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div
              style={{
                borderTop: "1px solid rgba(0,0,0,0.07)",
                marginTop: "14px",
                paddingTop: "14px",
                fontSize: "13px",
              }}
            >
              {isCOD ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      color: "#666",
                    }}
                  >
                    <span>Order Total</span>
                    <span style={{ fontWeight: 700, color: "#111110" }}>₹{amountTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      color: "#2B9348",
                    }}
                  >
                    <span>Paid Now (COD Advance)</span>
                    <span style={{ fontWeight: 700 }}>₹{amountPaid}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#B45309",
                      fontWeight: 800,
                      fontSize: "14px",
                      borderTop: "1px dashed rgba(0,0,0,0.1)",
                      paddingTop: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <span>Pay on Delivery</span>
                    <span>₹{amountDue.toLocaleString("en-IN")}</span>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 800,
                    fontSize: "14px",
                    color: "#111110",
                  }}
                >
                  <span>Total Paid</span>
                  <span>₹{amountTotal.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery Info */}
        {!polling && shippingAddress?.fullName && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "20px",
              marginBottom: "20px",
              border: "1px solid rgba(0,0,0,0.07)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 800,
                textTransform: "uppercase",
                color: "#111110",
                margin: "0 0 12px 0",
                letterSpacing: "0.04em",
              }}
            >
              <Truck size={15} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
              Delivery Details
            </h3>
            <div style={{ fontSize: "13px", color: "#444", lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, color: "#111110" }}>{shippingAddress.fullName}</div>
              {shippingAddress.street && <div>{shippingAddress.street}</div>}
              {shippingAddress.apartment && <div>{shippingAddress.apartment}</div>}
              <div>
                {[shippingAddress.city, shippingAddress.state, shippingAddress.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              {shippingAddress.phone && (
                <div style={{ color: "#666", marginTop: "4px" }}>
                  📞 {shippingAddress.phone}
                </div>
              )}
            </div>
            <div
              style={{
                marginTop: "12px",
                padding: "8px 12px",
                borderRadius: "6px",
                backgroundColor: "#F0FDF4",
                fontSize: "12px",
                color: "#2B9348",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Truck size={13} />
              <span>Free insured express delivery — 3 to 5 business days</span>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        {!polling && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link
              href="/account?tab=orders"
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
              <Package size={16} />
              <span>View My Orders</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/products"
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
              <Home size={15} />
              <span>Continue Shopping</span>
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

export default function OrderSuccessPage() {
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
      <OrderSuccessContent />
    </Suspense>
  );
}

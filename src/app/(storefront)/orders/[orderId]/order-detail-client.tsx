"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  Download,
  Share2,
  AlertCircle,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useStore, Order } from "@/components/store-context";
import { auth } from "@/lib/firebase/client";

interface Props {
  orderId: string;
}

export function OrderDetailClient({ orderId }: Props) {
  const { orders, addToCart, showToast } = useStore();
  const [copied, setCopied] = useState(false);
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(!orders.some((o) => o.id.toLowerCase() === orderId.toLowerCase()));

  // Look in existing orders first
  const existingOrder = orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());

  useEffect(() => {
    if (existingOrder) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          const raw = json.data;
          const rawStatus = String(raw.status || "pending").toLowerCase();
          const status: Order["status"] =
            rawStatus === "delivered"
              ? "Delivered"
              : rawStatus === "shipped" || rawStatus === "out_for_delivery"
              ? "Shipped"
              : rawStatus === "cancelled" || rawStatus === "refunded"
              ? "Cancelled"
              : rawStatus === "processing" || rawStatus === "packed"
              ? "Processing"
              : "Order Confirmed";

          setFetchedOrder({
            id: String(raw.id || orderId),
            date: (raw.createdAt || "").split("T")[0] || new Date().toISOString().split("T")[0],
            items: (raw.items || []).map((item: any) => ({
              id: String(item.productId || item.id || ""),
              title: String(item.title || "Item"),
              price: Number(item.price || 0),
              quantity: Number(item.quantity || 1),
              selectedSize: String(item.selectedSize || "M"),
              selectedColor: item.selectedColor ? String(item.selectedColor) : undefined,
              image: String(item.image || ""),
            })),
            subtotal: Number(raw.subtotal || 0),
            discount: Number(raw.discount || 0),
            shipping: Number(raw.shipping || 0),
            total: Number(raw.total || 0),
            status,
            paymentMethod: String(raw.paymentMethod || "Online Payment"),
            paymentStatus: raw.paymentStatus === "paid" ? "Paid" : raw.paymentStatus === "refunded" ? "Refunded" : "Pending COD",
            shippingAddress: raw.shippingAddress || {},
            deliveryDateEstimate: String(raw.deliveryDateEstimate || "3-5 Business Days"),
            trackingNumber: String(raw.trackingNumber || `NXT-AWB-${raw.id?.slice(-6) || "998811"}`),
          });
        }
      } catch (err) {
        console.warn("[order-detail] Error fetching order:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [orderId, existingOrder]);

  const order = existingOrder || fetchedOrder;

  const handleShareTracking = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast("Tracking link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReorder = (item: Order["items"][0]) => {
    addToCart(
      {
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
      },
      item.selectedSize,
      item.selectedColor,
      1
    );
  };

  if (isLoading) {
    return (
      <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "80vh", padding: "80px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#111110" }} />
          <p style={{ fontSize: "14px", color: "#6A645C", fontWeight: 600 }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "80vh", padding: "80px 20px" }}>
        <div className="container" style={{ maxWidth: "560px", textAlign: "center" }}>
          <AlertCircle size={44} color="#D97706" style={{ margin: "0 auto 16px auto" }} />
          <h1 style={{ fontSize: "28px", fontWeight: 900, textTransform: "uppercase", color: "#111110" }}>
             Order Not Found
          </h1>
          <p style={{ fontSize: "14px", color: "#6A645C", marginTop: "8px", marginBottom: "28px" }}>
            We couldn't locate this order in your account. Sign in with the account used at checkout and try again.
          </p>
          <Link
            href="/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#111110",
              color: "#FFFFFF",
              padding: "12px 24px",
              borderRadius: "9999px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            <ArrowLeft size={15} />
            <span>View All Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  // Define tracking progress steps
  const steps = [
    { label: "Order Confirmed", date: order.date, completed: true },
    { label: "Fulfillment & Pack", date: "Processed", completed: true },
    { label: "Shipped with Courier", date: "In Transit", completed: order.status === "Shipped" || order.status === "Delivered" },
    { label: "Delivered", date: order.deliveryDateEstimate, completed: order.status === "Delivered" },
  ];

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "48px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href="/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#6D675E",
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to All Orders</span>
          </Link>

          <button
            onClick={handleShareTracking}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "9999px",
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.12)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#111110",
              cursor: "pointer",
            }}
          >
            <Share2 size={13} />
            <span>{copied ? "Link Copied!" : "Share Tracking"}</span>
          </button>
        </div>

        {/* Order Header Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
            padding: "28px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              paddingBottom: "24px",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.15em", color: "#936037", textTransform: "uppercase" }}>
                Order Summary
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 900, textTransform: "uppercase", color: "#111110", marginTop: "2px" }}>
                Order #{order.id}
              </h1>
              <div style={{ fontSize: "13px", color: "#777169", marginTop: "4px" }}>
                Placed on {order.date} • Total: <strong>₹{order.total.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "9999px",
                backgroundColor: order.status === "Delivered" ? "rgba(43, 147, 72, 0.1)" : "rgba(217, 119, 6, 0.1)",
                color: order.status === "Delivered" ? "#2B9348" : "#B45309",
                fontSize: "12.5px",
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: order.status === "Delivered" ? "#2B9348" : "#B45309",
                }}
              />
              <span>{order.status}</span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div style={{ paddingTop: "28px" }}>
            <h3 style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#78726A", marginBottom: "20px" }}>
              Shipment Tracking & Progress
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
                position: "relative",
              }}
              className="tracking-stepper"
            >
              {steps.map((st, idx) => (
                <div key={st.label} style={{ textAlign: "center", position: "relative" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: st.completed ? "#111110" : "#EBE7DF",
                      color: st.completed ? "#FFFFFF" : "#8A847C",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px auto",
                      fontWeight: 700,
                      fontSize: "13px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {st.completed ? <CheckCircle2 size={18} strokeWidth={2.5} /> : idx + 1}
                  </div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: st.completed ? "#111110" : "#8A847C" }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9A948C", marginTop: "2px" }}>
                    {st.date}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "24px",
                padding: "14px 18px",
                backgroundColor: "#FAF8F5",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
                fontSize: "12.5px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#111110" }}>
                <Truck size={16} color="#936037" />
                <span>Courier: <strong>Delhivery Surface Express</strong> (AWB: {order.trackingNumber})</span>
              </div>
              <span style={{ color: "#746E66" }}>
                Estimated Delivery: <strong>{order.deliveryDateEstimate}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: "24px",
          }}
          className="order-detail-grid"
        >
          {/* Left Column: Items List */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "28px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#111110",
                marginBottom: "20px",
              }}
            >
              Items in This Order ({order.items.length})
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {order.items.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "16px",
                    paddingBottom: "18px",
                    borderBottom: idx !== order.items.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  <div style={{ display: "flex", gap: "14px" }}>
                    <div
                      style={{
                        width: "64px",
                        height: "80px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        position: "relative",
                        backgroundColor: "#F3EFEA",
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111110", marginBottom: "4px" }}>
                        {item.title}
                      </h4>
                      <div style={{ fontSize: "12px", color: "#746E66", marginBottom: "8px" }}>
                        Size: <strong>{item.selectedSize}</strong>
                        {item.selectedColor ? ` • ${item.selectedColor}` : ""} • Qty: {item.quantity}
                      </div>

                      <button
                        onClick={() => handleReorder(item)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#111110",
                          textDecoration: "underline",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <ShoppingBag size={12} />
                        <span>Reorder Item</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#111110" }}>
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "11px", color: "#8E8880" }}>₹{item.price} each</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Address & Payment */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Address */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#111110",
                  marginBottom: "12px",
                }}
              >
                <MapPin size={15} color="#936037" />
                <span>Shipping Address</span>
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                {order.shippingAddress.fullName}
              </div>
              <div style={{ fontSize: "12.5px", color: "#6A645C", marginTop: "4px", lineHeight: "1.5" }}>
                {order.shippingAddress.street}
                {order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ""}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
              </div>
              <div style={{ fontSize: "12px", color: "#8A847C", marginTop: "8px" }}>
                Phone: {order.shippingAddress.phone}
              </div>
            </div>

            {/* Payment Summary */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#111110",
                  marginBottom: "16px",
                }}
              >
                <CreditCard size={15} color="#936037" />
                <span>Payment Summary</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#6A645C", marginBottom: "6px" }}>
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>

              {order.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#2B9348", marginBottom: "6px" }}>
                  <span>Discount</span>
                  <span>-₹{order.discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#6A645C", marginBottom: "12px" }}>
                <span>Delivery Charge</span>
                <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "15px",
                  fontWeight: 900,
                  color: "#111110",
                  borderTop: "1px dashed rgba(0,0,0,0.12)",
                  paddingTop: "12px",
                  marginBottom: "16px",
                }}
              >
                <span>Total Paid</span>
                <span>₹{order.total.toLocaleString("en-IN")}</span>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  padding: "10px 12px",
                  backgroundColor: "#FAF9F5",
                  borderRadius: "8px",
                  color: "#746E66",
                  lineHeight: "1.4",
                }}
              >
                Method: <strong>{order.paymentMethod}</strong>
                <br />
                Status:{" "}
                <span
                  style={{
                    color: order.paymentStatus === "Paid" ? "#2B9348" : "#D97706",
                    fontWeight: 700,
                  }}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .order-detail-grid {
            grid-template-columns: 1fr !important;
          }
          .tracking-stepper {
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}

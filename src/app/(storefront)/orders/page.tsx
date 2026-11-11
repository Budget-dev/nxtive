"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Truck,
  ArrowRight,
  Clock,
  CheckCircle2,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Loader2,
  FileText,
  Search,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore, Order } from "@/components/store-context";
import { useAuth } from "@/features/auth";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";

// Normalize order status from Firestore raw value
function resolveOrderStatus(raw: string): Order["status"] {
  const s = (raw || "").toLowerCase();
  if (s === "delivered") return "Delivered";
  if (s === "shipped" || s === "out_for_delivery") return "Shipped";
  if (s === "cancelled") return "Cancelled";
  if (s === "processing" || s === "packed" || s === "payment_confirmed") return "Processing";
  if (s === "failed") return "Payment Failed";
  if (s === "created" || s === "pending") return "Pending";
  return "Order Confirmed";
}

// Normalize payment status from Firestore raw value
function resolvePaymentStatus(raw: string): Order["paymentStatus"] {
  const s = (raw || "").toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "refunded") return "Refunded";
  if (s === "failed") return "Payment Failed";
  if (s === "cod_pending") return "Pending COD";
  return "Pending";
}

// Map an order raw doc → Order shape
function mapRawOrder(docId: string, raw: any): Order {
  return {
    id: docId,
    date: (raw.createdAt || "").split("T")[0] || new Date().toISOString().split("T")[0],
    items: (raw.items || []).map((i: any) => ({
      id: String(i.productId || i.id || ""),
      title: String(i.title || "Item"),
      price: Number(i.price || 0),
      quantity: Number(i.quantity || 1),
      selectedSize: String(i.selectedSize || "M"),
      selectedColor: i.selectedColor ? String(i.selectedColor) : undefined,
      image: String(i.image || ""),
    })),
    subtotal: Number(raw.subtotal || 0),
    discount: Number(raw.discount || 0),
    shipping: Number(raw.shipping || 0),
    total: Number(raw.total || raw.totalAmount || raw.amount || 0),
    status: resolveOrderStatus(raw.status),
    paymentMethod: raw.paymentMethod || "Online Payment",
    paymentStatus: resolvePaymentStatus(raw.paymentStatus),
    shippingAddress: raw.shippingAddress || {},
    deliveryDateEstimate: raw.deliveryDateEstimate || "3-5 Business Days",
    trackingNumber: raw.trackingNumber || raw.awbCode || "",
    errorDescription: raw.errorDescription || raw.error_description || undefined,
    errorCode: raw.errorCode || raw.error_code || undefined,
    razorpayOrderId: raw.razorpayOrderId || undefined,
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const { orders: storeOrders, addToCart } = useStore();
  const { user } = useAuth();
  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "delivered" | "failed">("all");
  const [trackQuery, setTrackQuery] = useState("");

  useEffect(() => {
    if (storeOrders.length > 0) return;
    let mounted = true;
    async function load() {
      setLoadingOrders(true);

      // 1. Direct Firestore query for current user or session order (zero server dependency)
      try {
        const uid = auth.currentUser?.uid || user?.uid;
        const email = auth.currentUser?.email || user?.email;
        const collectedOrders: Order[] = [];

        // Check sessionStorage for instant guest order recovery
        try {
          const stored = sessionStorage.getItem("last_confirmed_order");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed.id || parsed.orderNumber)) {
              collectedOrders.push({
                id: String(parsed.id || parsed.orderNumber),
                date: (parsed.createdAt || "").split("T")[0] || new Date().toISOString().split("T")[0],
                items: (parsed.items || []).map((i: any) => ({
                  id: String(i.productId || i.id || ""),
                  title: String(i.title || "Item"),
                  price: Number(i.price || 0),
                  quantity: Number(i.quantity || 1),
                  selectedSize: String(i.selectedSize || "M"),
                  selectedColor: i.selectedColor ? String(i.selectedColor) : undefined,
                  image: String(i.image || ""),
                })),
                subtotal: Number(parsed.subtotal || 0),
                discount: Number(parsed.discount || 0),
                shipping: Number(parsed.shipping || 0),
                total: Number(parsed.total || parsed.totalAmount || parsed.amount || 0),
                status: resolveOrderStatus(parsed.status || "confirmed"),
                paymentMethod: parsed.paymentMethod || "Online Payment",
                paymentStatus: resolvePaymentStatus(parsed.paymentStatus || "paid"),
                shippingAddress: parsed.shippingAddress || {},
                deliveryDateEstimate: parsed.deliveryDateEstimate || "3-5 Business Days",
                trackingNumber: parsed.trackingNumber || parsed.awbCode || "",
              });
            }
          }
        } catch { }

        if (uid) {
          const qUid = query(collection(db, "orders"), where("userId", "==", uid));
          const snap = await getDocs(qUid);
          snap.forEach((doc: any) => {
            if (!collectedOrders.some((o) => o.id === doc.id)) {
              collectedOrders.push(mapRawOrder(doc.id, doc.data()));
            }
          });
        }

        if (email) {
          const qEmail = query(collection(db, "orders"), where("customerEmail", "==", email));
          const snapEmail = await getDocs(qEmail);
          snapEmail.forEach((doc: any) => {
            if (!collectedOrders.some((o) => o.id === doc.id)) {
              collectedOrders.push(mapRawOrder(doc.id, doc.data()));
            }
          });
        }

        if (collectedOrders.length > 0 && mounted) {
          setFetchedOrders(collectedOrders);
          setLoadingOrders(false);
          return;
        }
      } catch (err) {
        console.warn("Direct Firestore read notice:", err);
      }

      // 2. Fallback to /api/orders with safe JSON parsing
      try {
        const token = await auth.currentUser?.getIdToken().catch(() => null);
        const res = await fetch("/api/orders?page=1&pageSize=50", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const json = await res.json();
          if (mounted && json.success && Array.isArray(json.data?.items)) {
            const normalized: Order[] = json.data.items.map((raw: any) =>
              mapRawOrder(String(raw.id || ""), raw)
            );
            setFetchedOrders(normalized);
          }
        }
      } catch (e) {
        console.warn("Failed to load orders on orders page:", e);
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [storeOrders.length, user?.uid, user?.email]);

  const orders = storeOrders.length > 0 ? storeOrders : fetchedOrders;

  const filteredOrders = orders.filter((order) => {
    if (filter === "delivered") return order.status === "Delivered";
    if (filter === "active") return order.status !== "Delivered" && order.status !== "Payment Failed" && order.status !== "Pending";
    if (filter === "failed") return order.status === "Payment Failed" || order.status === "Pending";
    return true;
  });

  const failedCount = orders.filter((o) => o.status === "Payment Failed" || o.paymentStatus === "Payment Failed").length;

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "48px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "940px" }}>
        {/* Page Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--accent-next)",
                marginBottom: "4px",
              }}
            >
              Order Management
            </div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: "#111110",
              }}
            >
              Your Order History
            </h1>
            <p style={{ fontSize: "13.5px", color: "#6F6961", marginTop: "4px" }}>
              Track active shipments, download invoices, and reorder your favorite NXTIVE essentials.
            </p>
          </div>

          <Link
            href="/account"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#111110",
              textDecoration: "underline",
            }}
          >
            ← Back to Account
          </Link>
        </div>

        {/* Quick Track Search */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            padding: "18px 24px",
            marginBottom: "28px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(147, 96, 55, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#936037",
              }}
            >
              <Truck size={18} />
            </div>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#111110" }}>
                Track a Specific Order or AWB
              </div>
              <div style={{ fontSize: "12px", color: "#6F6961" }}>
                Have an order number from SMS or email? Track its live journey instantly.
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (trackQuery.trim()) {
                router.push(`/orders/track?orderId=${encodeURIComponent(trackQuery.trim())}`);
              }
            }}
            style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "420px", minWidth: "260px" }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                }}
              />
              <input
                type="text"
                placeholder="Enter Order ID or AWB..."
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 36px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(0,0,0,0.14)",
                  fontSize: "12.5px",
                  outline: "none",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                backgroundColor: "#111110",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "9999px",
                padding: "9px 20px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Track Live
            </button>
          </form>
        </div>

        {/* Filter Pills */}
        <div
          className="scroll-touch no-scrollbar"
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "28px",
            overflowX: "auto",
            whiteSpace: "nowrap",
            paddingBottom: "4px",
          }}
        >
          {[
            { id: "all", label: `All Orders (${orders.length})` },
            {
              id: "active",
              label: `Active Shipments (${orders.filter((o) => o.status !== "Delivered" && o.status !== "Payment Failed" && o.status !== "Pending").length})`,
            },
            {
              id: "delivered",
              label: `Delivered (${orders.filter((o) => o.status === "Delivered").length})`,
            },
            ...(failedCount > 0
              ? [{ id: "failed", label: `Payment Issues (${failedCount})` }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: "8px 18px",
                borderRadius: "9999px",
                fontSize: "12.5px",
                fontWeight: 600,
                border: "1px solid",
                borderColor:
                  filter === tab.id
                    ? tab.id === "failed" ? "#DC2626" : "#111110"
                    : "rgba(0,0,0,0.12)",
                backgroundColor:
                  filter === tab.id
                    ? tab.id === "failed" ? "#DC2626" : "#111110"
                    : "#FFFFFF",
                color: filter === tab.id ? "#FFFFFF" : "#111110",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div
            className="order-card"
            style={{
              padding: "60px 24px",
              textAlign: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <Package size={44} color="#A39D95" style={{ margin: "0 auto 16px auto" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "8px" }}>
              No Orders Found
            </h3>
            <p style={{ fontSize: "13.5px", color: "#746E66", maxWidth: "380px", margin: "0 auto 24px auto" }}>
              {filter === "all"
                ? "You haven't placed any orders yet. Discover our latest oversized tees and jackets."
                : `You don't have any ${filter} orders right now.`}
            </p>
            <Link
              href="/products"
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
              className="btn-pill-dark"
            >
              <ShoppingBag size={15} />
              <span>Browse Catalog</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredOrders.map((order) => {
              const isDelivered = order.status === "Delivered";
              const isPaymentFailed = order.status === "Payment Failed" || order.paymentStatus === "Payment Failed";
              const isPending = order.status === "Pending" && !isPaymentFailed;

              // Determine badge colors
              let badgeBg = "rgba(217, 119, 6, 0.1)";
              let badgeColor = "#B45309";
              if (isDelivered) { badgeBg = "rgba(43, 147, 72, 0.1)"; badgeColor = "#2B9348"; }
              else if (isPaymentFailed) { badgeBg = "rgba(220, 38, 38, 0.1)"; badgeColor = "#DC2626"; }
              else if (isPending) { badgeBg = "rgba(107, 114, 128, 0.1)"; badgeColor = "#6B7280"; }

              return (
                <div
                  key={order.id}
                  className="order-card"
                  style={{
                    boxShadow: isPaymentFailed
                      ? "0 6px 20px rgba(220, 38, 38, 0.06)"
                      : "0 6px 20px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                    padding: 0,
                    transition: "box-shadow 0.2s ease",
                    border: isPaymentFailed ? "1px solid rgba(220, 38, 38, 0.15)" : undefined,
                  }}
                >
                  {/* Payment Failed Banner */}
                  {isPaymentFailed && (
                    <div
                      style={{
                        backgroundColor: "rgba(220, 38, 38, 0.06)",
                        borderBottom: "1px solid rgba(220, 38, 38, 0.15)",
                        padding: "10px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <XCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#DC2626" }}>
                          Payment Failed
                        </div>
                        {order.errorDescription && (
                          <div style={{ fontSize: "11.5px", color: "#B91C1C", marginTop: "2px" }}>
                            {order.errorDescription}
                            {order.errorCode ? ` (Code: ${order.errorCode})` : ""}
                          </div>
                        )}
                        {!order.errorDescription && (
                          <div style={{ fontSize: "11.5px", color: "#6B7280", marginTop: "2px" }}>
                            Your payment could not be processed. No money was debited. Please try again.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Top Bar */}
                  <div
                    style={{
                      padding: "clamp(14px, 3vw, 18px) clamp(16px, 3.5vw, 24px)",
                      backgroundColor: "#FAF9F5",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#8E8880", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Order ID
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#111110", marginTop: "2px" }}>
                          #{order.id}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#8E8880", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Placed Date
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#111110", marginTop: "2px" }}>
                          {order.date}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#8E8880", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Total Amount
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#111110", marginTop: "2px" }}>
                          ₹{order.total.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 14px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: 700,
                          backgroundColor: badgeBg,
                          color: badgeColor,
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: badgeColor,
                          }}
                        />
                        <span>{order.status}</span>
                      </span>

                      {!isPaymentFailed && (
                        <Link
                          href={`/orders/invoice?orderId=${encodeURIComponent(order.id)}`}
                          title="View & Download Invoice"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: isDelivered ? "#2B9348" : "#111110",
                            backgroundColor: isDelivered ? "#F0FDF4" : "#FFFFFF",
                            border: isDelivered ? "1px solid rgba(43, 147, 72, 0.3)" : "1px solid rgba(0,0,0,0.12)",
                            padding: "6px 12px",
                            borderRadius: "9999px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <FileText size={13} />
                          <span>Invoice</span>
                        </Link>
                      )}

                      {isPaymentFailed ? (
                        <Link
                          href="/checkout"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            backgroundColor: "#DC2626",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "9999px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <span>Try Again</span>
                          <ChevronRight size={14} />
                        </Link>
                      ) : (
                        <Link
                          href={`/orders/track?orderId=${encodeURIComponent(order.id)}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: "#111110",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(0,0,0,0.12)",
                            padding: "6px 14px",
                            borderRadius: "9999px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <span>Details</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Order Items Row */}
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {order.items.map((item, idx) => (
                        <div
                          key={`${item.id}-${idx}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "16px",
                            opacity: isPaymentFailed ? 0.6 : 1,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div
                              style={{
                                width: "52px",
                                height: "64px",
                                borderRadius: "6px",
                                overflow: "hidden",
                                position: "relative",
                                backgroundColor: "#F3EFEA",
                                flexShrink: 0,
                              }}
                            >
                              <Image
                                src={item.image || "/images/nxtvie/cat-tshirts.jpg"}
                                alt={item.title}
                                fill
                                unoptimized
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  if (!target.src.includes("/images/nxtvie/cat-tshirts.jpg")) {
                                    target.src = "/images/nxtvie/cat-tshirts.jpg";
                                  }
                                }}
                                style={{ objectFit: "cover" }}
                                sizes="52px"
                              />
                            </div>
                            <div>
                              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                                {item.title}
                              </div>
                              <div style={{ fontSize: "12px", color: "#746E66", marginTop: "2px" }}>
                                Size: {item.selectedSize}
                                {item.selectedColor ? ` • ${item.selectedColor}` : ""} • Qty: {item.quantity}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Status strip */}
                    {!isPaymentFailed && (
                      <div
                        style={{
                          marginTop: "18px",
                          paddingTop: "14px",
                          borderTop: "1px solid rgba(0,0,0,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px",
                          fontSize: "12px",
                          color: "#746E66",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Truck size={14} color="#936037" />
                            <span>
                              {isDelivered
                                ? `Delivered on ${order.deliveryDateEstimate}`
                                : `Estimated delivery: ${order.deliveryDateEstimate}`}
                            </span>
                          </div>
                          {order.trackingNumber && !order.trackingNumber.includes("998811") && !order.trackingNumber.includes("1001") && (
                            <span style={{ fontSize: "11px", color: "#936037", fontWeight: 700, backgroundColor: "rgba(147, 96, 55, 0.08)", padding: "2px 8px", borderRadius: "9999px" }}>
                              AWB: {order.trackingNumber}
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                          <Link
                            href={`/orders/track?orderId=${encodeURIComponent(order.id)}`}
                            style={{
                              fontWeight: 700,
                              color: "#111110",
                              textDecoration: "underline",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>Track Package</span>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Failed payment footer */}
                    {isPaymentFailed && (
                      <div
                        style={{
                          marginTop: "18px",
                          paddingTop: "14px",
                          borderTop: "1px solid rgba(220, 38, 38, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "#9CA3AF" }}>
                          <AlertCircle size={13} style={{ display: "inline", marginRight: "4px", color: "#DC2626" }} />
                          Payment not processed — your cart items are safe. Try checkout again to complete your order.
                        </div>
                        <Link
                          href="/checkout"
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: "#DC2626",
                            textDecoration: "underline",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>Retry Checkout</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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
} from "lucide-react";
import { useStore, Order } from "@/components/store-context";
import { useAuth } from "@/features/auth";
import { auth } from "@/lib/firebase/client";

export default function OrdersPage() {
  const { orders: storeOrders, addToCart } = useStore();
  const { user } = useAuth();
  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "delivered">("all");

  useEffect(() => {
    if (storeOrders.length > 0) return;
    let mounted = true;
    async function load() {
      setLoadingOrders(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/orders?page=1&pageSize=50", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        const json = await res.json();
        if (mounted && json.success && Array.isArray(json.data?.items)) {
          const normalized: Order[] = json.data.items.map((raw: any) => ({
            id: String(raw.id || ""),
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
            total: Number(raw.total || 0),
            status:
              raw.status === "Delivered" || raw.status === "delivered"
                ? "Delivered"
                : raw.status === "shipped" || raw.status === "out_for_delivery"
                ? "Shipped"
                : raw.status === "cancelled"
                ? "Cancelled"
                : raw.status === "processing"
                ? "Processing"
                : "Order Confirmed",
            paymentMethod: raw.paymentMethod || "Online Payment",
            paymentStatus: raw.paymentStatus === "paid" ? "Paid" : "Pending COD",
            shippingAddress: raw.shippingAddress || {},
            deliveryDateEstimate: raw.deliveryDateEstimate || "3-5 Business Days",
            trackingNumber: raw.trackingNumber || `NXT-AWB-${raw.id?.slice(-6) || "1001"}`,
          }));
          setFetchedOrders(normalized);
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
  }, [storeOrders.length]);

  const orders = storeOrders.length > 0 ? storeOrders : fetchedOrders;

  const filteredOrders = orders.filter((order) => {
    if (filter === "delivered") return order.status === "Delivered";
    if (filter === "active") return order.status !== "Delivered";
    return true;
  });

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

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
          {[
            { id: "all", label: `All Orders (${orders.length})` },
            {
              id: "active",
              label: `Active Shipments (${orders.filter((o) => o.status !== "Delivered").length})`,
            },
            {
              id: "delivered",
              label: `Delivered (${orders.filter((o) => o.status === "Delivered").length})`,
            },
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
                borderColor: filter === tab.id ? "#111110" : "rgba(0,0,0,0.12)",
                backgroundColor: filter === tab.id ? "#111110" : "#FFFFFF",
                color: filter === tab.id ? "#FFFFFF" : "#111110",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "60px 24px",
              textAlign: "center",
              border: "1px solid rgba(0,0,0,0.06)",
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

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "16px",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                    transition: "box-shadow 0.2s ease",
                  }}
                >
                  {/* Order Top Bar */}
                  <div
                    style={{
                      padding: "18px 24px",
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
                          backgroundColor: isDelivered ? "rgba(43, 147, 72, 0.1)" : "rgba(217, 119, 6, 0.1)",
                          color: isDelivered ? "#2B9348" : "#B45309",
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: isDelivered ? "#2B9348" : "#B45309",
                          }}
                        />
                        <span>{order.status}</span>
                      </span>

                      <Link
                        href={`/orders/${order.id}`}
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
                                src={item.image}
                                alt={item.title}
                                fill
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
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Truck size={14} color="#936037" />
                        <span>
                          {isDelivered
                            ? `Delivered on ${order.deliveryDateEstimate}`
                            : `Estimated delivery: ${order.deliveryDateEstimate}`}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "16px" }}>
                        <Link
                          href={`/orders/${order.id}`}
                          style={{ fontWeight: 700, color: "#111110", textDecoration: "underline" }}
                        >
                          Track Package
                        </Link>
                      </div>
                    </div>
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

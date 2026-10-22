"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS } from "@/constants/order-status";
import type { Order, OrderStatus } from "@/types/order";
import { updateOrderStatus, updateOrderPaymentStatus } from "../server/actions";

interface OrderDetailManagerProps {
  order: Order;
}

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "payment_confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

export function OrderDetailManager({ order: initialOrder }: OrderDetailManagerProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(initialOrder.status);
  const [statusNote, setStatusNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState(initialOrder.trackingNumber || "");
  const [trackingUrl, setTrackingUrl] = useState(initialOrder.trackingUrl || "");
  const [courier, setCourier] = useState("BlueDart");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);


  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    try {
      const computedUrl =
        trackingUrl ||
        (trackingNumber
          ? courier === "BlueDart"
            ? `https://www.bluedart.com/tracking?track=${trackingNumber}`
            : `https://www.delhivery.com/track/package/${trackingNumber}`
          : undefined);

      const res = await updateOrderStatus(order.id, selectedStatus, statusNote, {
        trackingNumber: trackingNumber || undefined,
        trackingUrl: computedUrl,
      });

      if (res.success) {
        setMessage({ type: "success", text: `Order status updated to ${ORDER_STATUS_LABELS[selectedStatus]}` });
        setOrder((prev: Order) => ({
          ...prev,
          status: selectedStatus,
          trackingNumber: trackingNumber || prev.trackingNumber,
          trackingUrl: computedUrl || prev.trackingUrl,
          statusHistory: [
            ...(prev.statusHistory || []),
            {
              status: selectedStatus,
              timestamp: new Date().toISOString(),
              note: statusNote || `Status changed to ${selectedStatus}`,
              updatedBy: "admin",
            },
          ],
        }));
        setStatusNote("");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update order status." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to update order." });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePayment = async (newPayStatus: "paid" | "refunded" | "cod_pending" | "failed") => {
    setUpdating(true);
    setMessage(null);
    try {
      const res = await updateOrderPaymentStatus(order.id, newPayStatus);
      if (res.success) {
        setOrder((prev: Order) => ({ ...prev, paymentStatus: newPayStatus }));
        setMessage({ type: "success", text: `Payment status updated to ${newPayStatus.toUpperCase()}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update payment status." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to update payment." });
    } finally {
      setUpdating(false);
    }
  };

  const label = ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status;
  let badgeClass = "info";
  if (order.status === "delivered") badgeClass = "success";
  else if (order.status === "cancelled" || order.status === "refunded") badgeClass = "danger";
  else if (order.status === "processing" || order.status === "packed") badgeClass = "warning";
  else if (order.status === "out_for_delivery") badgeClass = "purple";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Back button & Title Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <Link
          href="/admin/orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--adm-text-muted)",
            fontSize: "0.85rem",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to All Orders</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={`admin-badge ${badgeClass}`} style={{ fontSize: "0.82rem", padding: "6px 14px" }}>
            <span className="admin-badge-dot" />
            {label}
          </span>
          <span
            style={{
              fontSize: "0.82rem",
              padding: "6px 12px",
              borderRadius: "999px",
              backgroundColor: order.paymentStatus === "paid" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              color: order.paymentStatus === "paid" ? "#34D399" : "#FBBF24",
              fontWeight: 700,
            }}
          >
            Payment: {order.paymentStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Header Card */}
      <div
        className="admin-panel"
        style={{
          marginBottom: "24px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F2AC24", fontFamily: "var(--adm-font-mono)" }}>
              {order.orderNumber}
            </h2>
            <span style={{ fontSize: "0.8rem", color: "var(--adm-text-muted)" }}>
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--adm-text-secondary)" }}>
            Fulfillment method: {order.deliveryMethod} • Courier: {courier}
          </p>
        </div>

        {order.paymentStatus === "paid" && (
          <span className="admin-action-btn-secondary" style={{ color: "var(--adm-text-muted)", cursor: "not-allowed" }}>
            Refund unavailable until payment provider integration is implemented
          </span>
        )}
      </div>

      {message && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "8px",
            marginBottom: "24px",
            backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            color: message.type === "success" ? "#34D399" : "#F87171",
            fontSize: "0.88rem",
          }}
        >
          {message.text}
        </div>
      )}

      {/* Main Grid: Left Items & Customer / Right Fulfillment Controller & Timeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Card: Order Items */}
          <div className="admin-panel" style={{ margin: 0 }}>
            <div className="admin-panel-header">
              <div className="admin-panel-title-wrap">
                <h3>Order Items ({order.items?.length})</h3>
                <p>Apparel garments, size specifications, and prices</p>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "64px" }}>Garment</th>
                    <th>Details</th>
                    <th>Size / Color</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td>
                        <div
                          style={{
                            width: "48px",
                            height: "60px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            backgroundColor: "#161514",
                            border: "1px solid var(--adm-border)",
                          }}
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--adm-text)" }}>{item.title}</div>
                        <div style={{ fontSize: "0.74rem", color: "var(--adm-text-muted)" }}>SKU: #{item.productId}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              color: "var(--adm-gold)",
                            }}
                          >
                            Size: {item.selectedSize}
                          </span>
                          {item.selectedColor && (
                            <span style={{ fontSize: "0.72rem", color: "var(--adm-text-muted)" }}>
                              Color: {item.selectedColor}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: "var(--adm-text)" }}>{item.quantity}</span>
                      </td>
                      <td>{formatCurrency(item.price)}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--adm-text)" }}>
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Breakdown Footer */}
            <div
              style={{
                padding: "20px 24px",
                borderTop: "1px solid var(--adm-border)",
                backgroundColor: "rgba(255, 255, 255, 0.01)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                alignItems: "flex-end",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "240px", fontSize: "0.85rem", color: "var(--adm-text-muted)" }}>
                <span>Subtotal:</span>
                <span style={{ color: "var(--adm-text)" }}>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", width: "240px", fontSize: "0.85rem", color: "#34D399" }}>
                  <span>Discount ({order.couponCode || "Promo"}):</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", width: "240px", fontSize: "0.85rem", color: "var(--adm-text-muted)" }}>
                <span>Shipping:</span>
                <span style={{ color: "var(--adm-text)" }}>
                  {order.shipping === 0 ? "Free" : formatCurrency(order.shipping)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "240px",
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#FBF9F5",
                  borderTop: "1px solid var(--adm-border)",
                  paddingTop: "8px",
                  marginTop: "4px",
                }}
              >
                <span>Grand Total:</span>
                <span style={{ color: "#F2AC24" }}>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Card: Customer & Shipping Details */}
          <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} style={{ color: "var(--adm-gold)" }} />
              Customer &amp; Shipping Destination
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--adm-text-muted)", marginBottom: "6px" }}>
                  Customer Details
                </div>
                <div style={{ fontWeight: 700, color: "var(--adm-text)", fontSize: "0.95rem" }}>
                  {order.shippingAddress?.fullName}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--adm-text-secondary)", marginTop: "2px" }}>
                  {order.shippingAddress?.email}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--adm-text-secondary)", marginTop: "2px" }}>
                  {order.shippingAddress?.phone}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--adm-text-muted)", marginBottom: "6px" }}>
                  Delivery Address
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--adm-text)", lineHeight: 1.5 }}>
                  {order.shippingAddress?.street}
                  {order.shippingAddress?.apartment && `, ${order.shippingAddress.apartment}`}
                  <br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                  <br />
                  {order.shippingAddress?.country}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Fulfillment & Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Card: Fulfillment Controller */}
          <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Truck size={18} style={{ color: "var(--adm-gold)" }} />
              Fulfillment &amp; Status Transition
            </h3>

            <form onSubmit={handleUpdateStatus} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label className="admin-form-label">Next Lifecycle Stage</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="admin-select"
                  style={{ width: "100%", padding: "10px 14px" }}
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {ORDER_STATUS_LABELS[st] || st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group" style={{ margin: 0 }}>
                <label className="admin-form-label">Logistics Partner</label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="admin-select"
                  style={{ width: "100%", padding: "10px 14px" }}
                >
                  <option value="BlueDart">BlueDart Express</option>
                  <option value="Delhivery">Delhivery Surface/Air</option>
                  <option value="DTDC">DTDC Courier</option>
                  <option value="IndiaPost">India Post Speed Post</option>
                </select>
              </div>

              <div className="admin-form-group" style={{ margin: 0 }}>
                <label className="admin-form-label">AWB / Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. BLUEDART-9842109"
                  className="admin-input"
                  style={{ fontFamily: "var(--adm-font-mono)", fontSize: "0.85rem" }}
                />
              </div>

              <div className="admin-form-group" style={{ margin: 0 }}>
                <label className="admin-form-label">Internal Operations Note</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Quality checked & sealed in warehouse batch A4"
                  className="admin-input"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="admin-action-btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
              >
                {updating ? "Updating..." : "Commit Status Change"}
              </button>
            </form>
          </div>

          {/* Card: Payment & Razorpay Details */}
          <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <CreditCard size={18} style={{ color: "var(--adm-gold)" }} />
              Payment Gateway Telemetry
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--adm-text-muted)" }}>Method:</span>
                <span style={{ fontWeight: 600, color: "var(--adm-text)" }}>{order.paymentMethod}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--adm-text-muted)" }}>Razorpay Order ID:</span>
                <span style={{ fontFamily: "var(--adm-font-mono)", color: "var(--adm-gold)" }}>
                  {order.razorpayOrderId || "N/A (Cash on Delivery)"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--adm-text-muted)" }}>Razorpay Payment ID:</span>
                <span style={{ fontFamily: "var(--adm-font-mono)", color: "var(--adm-text)" }}>
                  {order.razorpayPaymentId || "N/A"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--adm-text-muted)" }}>Status:</span>
                <span style={{ fontWeight: 700, color: order.paymentStatus === "paid" ? "#10B981" : "#F59E0B" }}>
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>

              {/* Quick Payment Status Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--adm-border)",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>Update Payment:</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {order.paymentStatus !== "paid" && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdatePayment("paid")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "11px",
                        fontWeight: 700,
                        borderRadius: "5px",
                        border: "1px solid #10B981",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        color: "#10B981",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Mark Paid
                    </button>
                  )}
                  {order.paymentStatus === "paid" && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdatePayment("refunded")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "11px",
                        fontWeight: 700,
                        borderRadius: "5px",
                        border: "1px solid #EF4444",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "#EF4444",
                        cursor: "pointer",
                      }}
                    >
                      Mark Refunded
                    </button>
                  )}
                  {order.paymentStatus !== "cod_pending" && order.paymentMethod?.toLowerCase().includes("cash") && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdatePayment("cod_pending")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "11px",
                        fontWeight: 700,
                        borderRadius: "5px",
                        border: "1px solid var(--adm-border)",
                        backgroundColor: "var(--adm-surface)",
                        color: "var(--adm-text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      COD Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Status Timeline History */}
          <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} style={{ color: "var(--adm-gold)" }} />
              Order Audit Timeline
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
              {order.statusHistory?.map((step: any, idx: number) => (
                <div key={idx} style={{ display: "flex", gap: "14px", position: "relative" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: idx === order.statusHistory.length - 1 ? "#F2AC24" : "#10B981",
                        border: "2px solid #0A0A0A",
                      }}
                    />
                    {idx < order.statusHistory.length - 1 && (
                      <div style={{ width: "2px", flex: 1, backgroundColor: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--adm-text)", textTransform: "capitalize" }}>
                        {ORDER_STATUS_LABELS[step.status as OrderStatus] || step.status}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--adm-text-muted)" }}>
                        {new Date(step.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {step.note && (
                      <div style={{ fontSize: "0.78rem", color: "var(--adm-text-secondary)", marginTop: "2px" }}>
                        {step.note}
                      </div>
                    )}
                    <div style={{ fontSize: "0.7rem", color: "var(--adm-text-faint)", marginTop: "2px" }}>
                      {new Date(step.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

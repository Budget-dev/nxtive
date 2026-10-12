"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  MapPin,
  CreditCard,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { useStore } from "@/components/store-context";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { orders } = useStore();

  const currentOrder = orderId ? orders.find((o) => o.id === orderId) : undefined;

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "60px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        {/* Success Header Badge */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#111110",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            }}
          >
            <CheckCircle2 size={36} strokeWidth={2} />
          </div>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--accent-next)",
              display: "block",
              marginBottom: "8px",
            }}
          >
            {currentOrder ? "Order Confirmed" : "Order Received"}
          </span>

          <h1
            style={{
              fontSize: "34px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#111110",
              marginBottom: "12px",
            }}
          >
            Thank You For Your Order
          </h1>

          <p style={{ fontSize: "14.5px", color: "#666057", maxWidth: "520px", margin: "0 auto" }}>
            {currentOrder
              ? <>We've received your request and our fulfillment team is preparing your package. A confirmation has been dispatched to <strong>{currentOrder.shippingAddress.email}</strong>.</>
              : "Your order was received. Sign in with the account used at checkout to view the protected order details."}
          </p>
        </div>

        {/* Order Details Card */}
        {currentOrder ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
              overflow: "hidden",
              marginBottom: "32px",
            }}
          >
            {/* Meta Bar */}
            <div
              style={{
                backgroundColor: "#161514",
                color: "#FFFFFF",
                padding: "20px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "#A8A29A", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Order Reference
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.01em", marginTop: "2px" }}>
                  #{currentOrder.id}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#A8A29A", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Placed On
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>
                    {currentOrder.date}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", color: "#A8A29A", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Status
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#4ADE80",
                      marginTop: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#4ADE80" }} />
                    {currentOrder.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Delivery Banner */}
            <div
              style={{
                padding: "16px 28px",
                backgroundColor: "#FAF8F5",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Truck size={18} color="#936037" />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#111110" }}>
                  Estimated Delivery:{" "}
                  <strong style={{ color: "#936037" }}>{currentOrder.deliveryDateEstimate}</strong>
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "#746E66" }}>
                Tracking ID: <strong>{currentOrder.trackingNumber}</strong>
              </span>
            </div>

            {/* Items List */}
            <div style={{ padding: "28px" }}>
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#111110",
                  marginBottom: "18px",
                }}
              >
                Purchased Items ({currentOrder.items.length})
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
                {currentOrder.items.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      paddingBottom: "16px",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div
                        style={{
                          width: "60px",
                          height: "72px",
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
                          sizes="60px"
                        />
                      </div>
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111110", marginBottom: "4px" }}>
                          {item.title}
                        </h4>
                        <div style={{ fontSize: "12px", color: "#78726A" }}>
                          Size: <strong>{item.selectedSize}</strong>
                          {item.selectedColor ? ` • Color: ${item.selectedColor}` : ""} • Qty: {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#111110" }}>
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8E8880" }}>
                        ₹{item.price} each
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping & Payment Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "24px",
                  padding: "20px",
                  backgroundColor: "#FAF9F5",
                  borderRadius: "10px",
                  marginBottom: "24px",
                }}
              >
                <div>
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
                      marginBottom: "8px",
                    }}
                  >
                    <MapPin size={14} color="#936037" />
                    <span>Shipping To</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#111110" }}>
                    {currentOrder.shippingAddress.fullName}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#6F6961", marginTop: "2px", lineHeight: "1.4" }}>
                    {currentOrder.shippingAddress.street}
                    {currentOrder.shippingAddress.apartment ? `, ${currentOrder.shippingAddress.apartment}` : ""}
                    <br />
                    {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} -{" "}
                    {currentOrder.shippingAddress.postalCode}
                    <br />
                    Phone: {currentOrder.shippingAddress.phone}
                  </div>
                </div>

                <div>
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
                      marginBottom: "8px",
                    }}
                  >
                    <CreditCard size={14} color="#936037" />
                    <span>Payment Information</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#111110" }}>
                    {currentOrder.paymentMethod}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#6F6961", marginTop: "2px" }}>
                    Status:{" "}
                    <span
                      style={{
                        color: currentOrder.paymentStatus === "Paid" ? "#2B9348" : "#D97706",
                        fontWeight: 700,
                      }}
                    >
                      {currentOrder.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6A645C", marginBottom: "6px" }}>
                  <span>Subtotal</span>
                  <span>₹{currentOrder.subtotal.toLocaleString("en-IN")}</span>
                </div>
                {currentOrder.discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#2B9348", marginBottom: "6px" }}>
                    <span>Discount Applied</span>
                    <span>-₹{currentOrder.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6A645C", marginBottom: "12px" }}>
                  <span>Delivery</span>
                  <span>{currentOrder.shipping === 0 ? "FREE" : `₹${currentOrder.shipping}`}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "17px",
                    fontWeight: 900,
                    color: "#111110",
                    borderTop: "1px dashed rgba(0,0,0,0.12)",
                    paddingTop: "12px",
                  }}
                >
                  <span>Grand Total</span>
                  <span>₹{currentOrder.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "48px 24px",
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            <p style={{ color: "#746E66", fontSize: "14px" }}>No recent order found in this session.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {currentOrder && (
            <Link
              href={`/orders/${currentOrder.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                padding: "13px 26px",
                borderRadius: "9999px",
                fontSize: "13.5px",
                fontWeight: 700,
                transition: "opacity 0.2s ease",
              }}
              className="btn-pill-dark"
            >
              <Package size={16} />
              <span>Track & View Order</span>
            </Link>
          )}

          <Link
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "transparent",
              color: "#111110",
              border: "1px solid rgba(0,0,0,0.2)",
              padding: "13px 26px",
              borderRadius: "9999px",
              fontSize: "13.5px",
              fontWeight: 700,
              transition: "all 0.2s ease",
            }}
            className="btn-pill-outline"
          >
            <ShoppingBag size={16} />
            <span>Continue Shopping</span>
          </Link>

          <Link
            href="/account"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#6D675E",
              fontSize: "13px",
              fontWeight: 600,
              padding: "13px 16px",
              textDecoration: "underline",
            }}
          >
            <span>Go to My Account</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 600 }}>
            Loading order details...
          </div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}

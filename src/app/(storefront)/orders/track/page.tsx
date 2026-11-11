import React, { Suspense } from "react";
import type { Metadata } from "next";
import { OrderDetailClient } from "../[orderId]/order-detail-client";

export const metadata: Metadata = {
  title: "Track Your Order | NXTIVE",
  description: "Live shipment tracking, carrier AWB status, and order details.",
};

export default function OrderTrackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            backgroundColor: "var(--bg-sand, #F6F4EE)",
            minHeight: "80vh",
            padding: "80px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "3px solid #E8E5DF",
                borderTopColor: "#121110",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#111110" }}>
              Connecting to NXTIVE Logistics...
            </div>
            <div style={{ fontSize: "12px", color: "#6A645C", marginTop: "4px" }}>
              Retrieving live shipment telemetry
            </div>
          </div>
        </div>
      }
    >
      <OrderDetailClient />
    </Suspense>
  );
}

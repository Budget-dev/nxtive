import React, { Suspense } from "react";
import type { Metadata } from "next";
import { StorefrontInvoiceClient } from "../[orderId]/invoice/invoice-client";

export const metadata: Metadata = {
  title: "Order Invoice | NXTIVE",
  description: "Official customer retail invoice, delivery status, and order bill of supply.",
};

export default function OrderInvoicePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            backgroundColor: "#F6F4EE",
            minHeight: "85vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
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
            <p style={{ fontSize: "14px", color: "#6A645C", fontWeight: 600 }}>
              Loading official invoice...
            </p>
          </div>
        </div>
      }
    >
      <StorefrontInvoiceClient />
    </Suspense>
  );
}


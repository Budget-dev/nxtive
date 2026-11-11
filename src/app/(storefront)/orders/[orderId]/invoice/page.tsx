import React, { Suspense } from "react";
import { Metadata } from "next";
import { StorefrontInvoiceClient } from "./invoice-client";

export const metadata: Metadata = {
  title: "Retail Invoice | NXTIVE",
  description: "Official customer retail invoice, delivery status, and order bill of supply.",
};

export async function generateStaticParams() {
  return [
    { orderId: "invoice" },
  ];
}

export default async function StorefrontInvoicePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
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
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "3px solid #E8E5DF",
              borderTopColor: "#121110",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      }
    >
      <StorefrontInvoiceClient orderId={orderId} />
    </Suspense>
  );
}

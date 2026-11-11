import React, { Suspense } from "react";
import { Metadata } from "next";
import { OrderDetailClient } from "./order-detail-client";

export const metadata: Metadata = {
  title: "Order Details | NXTIVE",
  description: "Track shipment and view order summary.",
};

export async function generateStaticParams() {
  return [
    { orderId: "track" },
    { orderId: "status" },
  ];
}

export default async function OrderDetailPage({
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
            minHeight: "80vh",
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
      <OrderDetailClient orderId={orderId} />
    </Suspense>
  );
}

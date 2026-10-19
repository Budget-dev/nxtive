import React from "react";
import { Metadata } from "next";
import { OrderDetailClient } from "./order-detail-client";

export const metadata: Metadata = {
  title: "Order Details | NXTIVE",
  description: "Track shipment and view order summary.",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <OrderDetailClient orderId={orderId} />;
}

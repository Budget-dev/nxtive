import React from "react";
import { Metadata } from "next";
import { StorefrontInvoiceClient } from "./invoice-client";

export const metadata: Metadata = {
  title: "Retail Invoice | NXTIVE",
  description: "Official customer retail invoice, delivery status, and order bill of supply.",
};

export default async function StorefrontInvoicePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <StorefrontInvoiceClient orderId={orderId} />;
}

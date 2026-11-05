import React from "react";
import { notFound } from "next/navigation";
import { getAdminOrderById } from "@/features/admin-dashboard/server/actions";
import { OrderInvoice } from "@/components/invoice/order-invoice";
import { AdminDataState } from "../../../_components/admin-data-state";

export const metadata = {
  title: "Tax Invoice | NXTIVE Operations",
  description: "Official GST tax invoice and fulfillment bill of supply.",
};

export default async function AdminOrderInvoicePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  let order = null;

  try {
    order = await getAdminOrderById(orderId);
  } catch (error) {
    return (
      <AdminDataState
        title="Order invoice unavailable"
        message={
          error instanceof Error
            ? error.message
            : "The order could not be retrieved to generate this invoice."
        }
      />
    );
  }

  if (!order) {
    notFound();
  }

  return (
    <OrderInvoice
      order={order}
      backUrl={`/admin/orders/${order.id || orderId}`}
      isAdmin={true}
    />
  );
}


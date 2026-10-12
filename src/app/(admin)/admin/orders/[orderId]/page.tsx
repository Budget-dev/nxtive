import React from "react";
import { notFound } from "next/navigation";
import { getAdminOrderById } from "@/features/admin-dashboard/server/actions";
import { OrderDetailManager } from "@/features/admin-dashboard/components/order-detail-manager";
import { AdminDataState } from "../../_components/admin-data-state";

export const metadata = {
  title: "Order Fulfillment | NXTIVE Admin",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  let order;
  try {
    order = await getAdminOrderById(orderId);
  } catch (error) {
    return (
      <AdminDataState
        title="Order data unavailable"
        message={error instanceof Error ? error.message : "The order could not be loaded from Firestore."}
      />
    );
  }

  if (!order) {
    notFound();
  }

  return <OrderDetailManager order={order} />;
}

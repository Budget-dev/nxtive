"use client";

import React, { useEffect, useState, use } from "react";
import { getAdminOrderById } from "@/features/admin-dashboard/client/actions";
import { OrderDetailManager } from "@/features/admin-dashboard/components/order-detail-manager";
import { AdminDataState } from "../../_components/admin-data-state";
import type { Order } from "@/types/order";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminOrderById(orderId)
      .then((data) => {
        if (!active) return;
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "The order could not be loaded from Firestore.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <AdminDataState
        title="Order data unavailable"
        message={error || "The order could not be found in Firestore."}
      />
    );
  }

  return <OrderDetailManager order={order} />;
}

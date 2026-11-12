"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getAdminOrderById } from "@/features/admin-dashboard/client/actions";
import { OrderDetailManager } from "@/features/admin-dashboard/components/order-detail-manager";
import { AdminDataState } from "../../_components/admin-data-state";
import type { Order } from "@/types/order";

interface AdminOrderDetailClientProps {
  orderId?: string;
}

export function AdminOrderDetailClient({ orderId: propOrderId }: AdminOrderDetailClientProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const effectiveOrderId = (
    (propOrderId && propOrderId !== "detail" && propOrderId !== "view")
      ? propOrderId
      : (searchParams?.get("orderId") || searchParams?.get("id")) ||
        (pathname && pathname.includes("/admin/orders/")
          ? pathname.split("/admin/orders/")[1]?.split("/")[0]?.split("?")[0]
          : "") ||
        ""
  ).trim();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!effectiveOrderId) {
      setLoading(false);
      setError("Please specify an Order ID to inspect.");
      return;
    }

    setLoading(true);
    getAdminOrderById(effectiveOrderId)
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
  }, [effectiveOrderId]);

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
        message={error || `The order #${effectiveOrderId} could not be found in Firestore.`}
      />
    );
  }

  return <OrderDetailManager order={order} />;
}
